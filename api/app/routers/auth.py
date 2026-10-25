"""Authentication router — register, login, me, logout, forgot-password, reset-password."""

import uuid
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from pydantic import BaseModel, Field

from app.database import (
    create_user,
    get_user_by_email,
    get_user_by_id,
    update_last_login,
    update_user_password,
    update_user_profile,
    create_password_reset_token,
    get_password_reset_token,
    mark_password_reset_token_used,
    revoke_session,
    revoke_all_user_sessions
)
from app.auth import (
    hash_password,
    verify_password,
    validate_password_strength,
    validate_and_normalize_email,
    create_access_token,
    create_refresh_token,
    decode_token,
    check_brute_force,
    record_failed_attempt,
    clear_failed_attempts,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter()


# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================
class RegisterRequest(BaseModel):
    email: str
    password: str
    confirm_password: str
    full_name: str
    phone: Optional[str] = None
    role: Optional[str] = "citizen"
    ward_id: Optional[str] = "w-001"
    terms_agreed: bool = True
    language: Optional[str] = "en"


class LoginRequest(BaseModel):
    email: str
    password: str
    remember_me: bool = False


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    ward_id: Optional[str] = "w-001"
    is_verified: bool = True
    created_at: str
    last_login_at: Optional[str] = None
    language: str = "en"


class AuthResponse(BaseModel):
    user: UserResponse
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    confirm_password: str


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    ward_id: Optional[str] = None
    language: Optional[str] = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str


def format_user_response(user_dict: Dict[str, Any]) -> UserResponse:
    return UserResponse(
        id=user_dict["id"],
        email=user_dict["email"],
        full_name=user_dict["full_name"],
        phone=user_dict.get("phone"),
        role=user_dict.get("role", "citizen"),
        ward_id=user_dict.get("ward_id", "w-001"),
        is_verified=bool(user_dict.get("is_verified", 1)),
        created_at=user_dict.get("created_at", ""),
        last_login_at=user_dict.get("last_login_at"),
        language=user_dict.get("language") or "en",
    )


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, response: Response):
    """Register a new user account with secure password hashing and validation."""
    # 1. Terms verification
    if not body.terms_agreed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must agree to the Terms of Service and Privacy Policy.",
        )

    # 2. Email validation & normalization
    valid_email, normalized_email, email_err = validate_and_normalize_email(body.email)
    if not valid_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=email_err)

    # 3. Check for existing user
    if get_user_by_email(normalized_email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists.",
        )

    # 4. Name check
    if len(body.full_name.strip()) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide your full name (minimum 2 characters).",
        )

    # 5. Password confirmation check
    if body.password != body.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match.",
        )

    # 6. Password strength check
    valid_pwd, pwd_err = validate_password_strength(body.password)
    if not valid_pwd:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=pwd_err)

    # 7. Create user in SQLite
    user_id = f"usr-{uuid.uuid4().hex[:10]}"
    hashed = hash_password(body.password)
    assigned_role = body.role if body.role in ["citizen", "municipal", "responder"] else "citizen"

    user = create_user(
        user_id=user_id,
        email=normalized_email,
        hashed_password=hashed,
        full_name=body.full_name,
        phone=body.phone,
        role=assigned_role,
        ward_id=body.ward_id or "w-001",
        is_verified=True,
        language=body.language or "en",
    )

    # 8. Generate JWT tokens
    access_token, exp = create_access_token(user_id=user["id"], role=user["role"], email=user["email"])
    refresh_token, _, _ = create_refresh_token(user_id=user["id"])

    # 9. Set secure HTTP-only cookies
    response.set_cookie(
        key="nirvana_access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=False,  # Allow http in development
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return AuthResponse(
        user=format_user_response(user),
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, request: Request, response: Response):
    """Authenticate with email and password and issue secure JWT tokens."""
    client_ip = request.client.host if request.client else "unknown"
    brute_key = f"{client_ip}:{body.email.strip().lower()}"

    # 1. Brute-force check
    is_allowed, lockout_remaining = check_brute_force(brute_key)
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed attempts. Account temporarily locked. Try again in {lockout_remaining} seconds.",
        )

    # 2. Email normalization
    valid_email, normalized_email, _ = validate_and_normalize_email(body.email)
    if not valid_email:
        record_failed_attempt(brute_key)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # 3. Retrieve user
    user = get_user_by_email(normalized_email)
    if not user:
        record_failed_attempt(brute_key)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # 4. Verify password
    if not verify_password(body.password, user["hashed_password"]):
        record_failed_attempt(brute_key)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # 5. Clear failed attempts on success
    clear_failed_attempts(brute_key)
    update_last_login(user["id"])

    # 6. Generate tokens
    access_token, _ = create_access_token(user_id=user["id"], role=user["role"], email=user["email"])
    refresh_token, _, _ = create_refresh_token(user_id=user["id"], remember_me=body.remember_me)

    # 7. Set HTTP-only cookie
    response.set_cookie(
        key="nirvana_access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return AuthResponse(
        user=format_user_response(user),
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Retrieve profile of the currently signed-in user."""
    return format_user_response(current_user)


@router.post("/logout")
async def logout(response: Response, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Sign out the current user and clear access token cookies."""
    response.delete_cookie(key="nirvana_access_token")
    return {"status": "success", "message": "Successfully signed out."}


@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(body: RefreshTokenRequest, response: Response):
    """Exchange a valid refresh token for a fresh access token."""
    try:
        payload = decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type.")
        user_id = payload.get("sub")
        user = get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account not found.")

        # Issue new access token
        new_access_token, _ = create_access_token(user_id=user["id"], role=user["role"], email=user["email"])

        response.set_cookie(
            key="nirvana_access_token",
            value=new_access_token,
            httponly=True,
            samesite="lax",
            secure=False,
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

        return AuthResponse(
            user=format_user_response(user),
            access_token=new_access_token,
            refresh_token=body.refresh_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not refresh session: {str(e)}",
        )


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    """Request a password reset link for the provided email address."""
    valid_email, normalized_email, _ = validate_and_normalize_email(body.email)
    # Always return a safe success response to prevent email enumeration attacks
    if not valid_email:
        return {
            "status": "success",
            "message": "If an account exists with this email, password reset instructions have been sent.",
        }

    user = get_user_by_email(normalized_email)
    reset_token = secrets.token_urlsafe(32)

    if user:
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        create_password_reset_token(reset_token, user["id"], expires_at)

    # In development, also return the reset_token so that the user can test the reset flow immediately!
    return {
        "status": "success",
        "message": "If an account exists with this email, password reset instructions have been sent.",
        "dev_reset_token": reset_token if user else None,
        "dev_reset_url": f"/reset-password?token={reset_token}" if user else None,
    }


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest):
    """Reset account password using a valid reset token."""
    token_record = get_password_reset_token(body.token)
    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset link.",
        )

    if token_record["used"] == 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password reset link has already been used.",
        )

    expires_at = datetime.fromisoformat(token_record["expires_at"])
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password reset link has expired. Please request a new one.",
        )

    if body.new_password != body.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match.",
        )

    valid_pwd, pwd_err = validate_password_strength(body.new_password)
    if not valid_pwd:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=pwd_err)

    # Hash new password and update
    new_hashed = hash_password(body.new_password)
    update_user_password(token_record["user_id"], new_hashed)
    mark_password_reset_token_used(body.token)
    revoke_all_user_sessions(token_record["user_id"])

    return {
        "status": "success",
        "message": "Your password has been successfully reset. You can now sign in with your new credentials.",
    }


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    body: UpdateProfileRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Update profile information for the authenticated user."""
    updated = update_user_profile(
        user_id=current_user["id"],
        full_name=body.full_name,
        phone=body.phone,
        ward_id=body.ward_id,
        language=body.language,
    )
    return format_user_response(updated)
