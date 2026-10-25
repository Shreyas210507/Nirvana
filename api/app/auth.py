"""Authentication security module — password hashing, JWT tokens, validation, and FastAPI dependencies."""

import re
import secrets
import time
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Tuple
import bcrypt
import jwt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer

from app.config import settings
from app.database import (
    get_user_by_id,
    create_session,
    is_session_revoked,
    revoke_session,
    create_user,
    get_user_by_email
)

# JWT configuration
JWT_SECRET = getattr(settings, "JWT_SECRET", "nirvana-hyperlocal-jwt-secret-key-2026-production")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 2  # 2 hours
REFRESH_TOKEN_EXPIRE_DAYS = 7
REMEMBER_ME_EXPIRE_DAYS = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

# In-memory brute force tracker: { key: [timestamps] }
FAILED_ATTEMPTS: Dict[str, list] = {}
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_SECONDS = 900  # 15 minutes


# ============================================================================
# PASSWORD HASHING & VERIFICATION (bcrypt)
# ============================================================================
def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt with 12 salt rounds."""
    # Ensure byte encoding and hash
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plaintext password against bcrypt hash in constant time."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def validate_password_strength(password: str) -> Tuple[bool, str]:
    """
    Enforce security standards on passwords:
    - Minimum 8 characters
    - At least 1 uppercase letter
    - At least 1 lowercase letter
    - At least 1 digit
    - At least 1 special character
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if len(password) > 128:
        return False, "Password cannot exceed 128 characters."
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter."
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter."
    if not re.search(r"\d", password):
        return False, "Password must contain at least one number."
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>\-_~`+=]", password):
        return False, "Password must contain at least one special character (!@#$%^&* etc.)."
    return True, ""


def validate_and_normalize_email(email: str) -> Tuple[bool, str, str]:
    """Validate and normalize email address to lowercase stripped format."""
    normalized = email.strip().lower()
    email_regex = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    if not re.match(email_regex, normalized) or len(normalized) > 255:
        return False, normalized, "Please enter a valid email address."
    return True, normalized, ""


# ============================================================================
# BRUTE-FORCE PROTECTION
# ============================================================================
def check_brute_force(key: str) -> Tuple[bool, int]:
    """Check if the given key (IP or email) is locked out due to repeated failures."""
    now = time.time()
    attempts = FAILED_ATTEMPTS.get(key, [])
    # Filter attempts within the window
    valid_attempts = [t for t in attempts if now - t < LOCKOUT_SECONDS]
    FAILED_ATTEMPTS[key] = valid_attempts

    if len(valid_attempts) >= MAX_FAILED_ATTEMPTS:
        remaining_lockout = int(LOCKOUT_SECONDS - (now - valid_attempts[0]))
        return False, max(1, remaining_lockout)
    return True, 0


def record_failed_attempt(key: str) -> None:
    """Record a failed login attempt."""
    now = time.time()
    if key not in FAILED_ATTEMPTS:
        FAILED_ATTEMPTS[key] = []
    FAILED_ATTEMPTS[key].append(now)


def clear_failed_attempts(key: str) -> None:
    """Clear failed attempts on successful login."""
    if key in FAILED_ATTEMPTS:
        del FAILED_ATTEMPTS[key]


# ============================================================================
# JWT TOKEN GENERATION & DECODING
# ============================================================================
def create_access_token(user_id: str, role: str, email: str) -> Tuple[str, datetime]:
    """Generate a signed JWT access token."""
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "role": role,
        "email": email,
        "type": "access",
        "exp": expires_at,
        "iat": datetime.now(timezone.utc),
    }
    encoded = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded, expires_at


def create_refresh_token(user_id: str, remember_me: bool = False) -> Tuple[str, str, datetime]:
    """Generate a persistent refresh token and register its session in DB."""
    token_id = secrets.token_urlsafe(32)
    days = REMEMBER_ME_EXPIRE_DAYS if remember_me else REFRESH_TOKEN_EXPIRE_DAYS
    expires_at = datetime.now(timezone.utc) + timedelta(days=days)

    payload = {
        "sub": user_id,
        "jti": token_id,
        "type": "refresh",
        "exp": expires_at,
        "iat": datetime.now(timezone.utc),
    }
    encoded = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    create_session(token_id, user_id, expires_at)
    return encoded, token_id, expires_at


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and verify a JWT token."""
    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return decoded
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ============================================================================
# FASTAPI DEPENDENCIES
# ============================================================================
def extract_token_from_request(request: Request, bearer_token: Optional[str]) -> Optional[str]:
    """Extract auth token from Authorization header or HTTP-only cookies."""
    if bearer_token:
        return bearer_token
    # Check cookies
    cookie_token = request.cookies.get("nirvana_access_token")
    if cookie_token:
        return cookie_token
    return None


async def get_current_user_optional(
    request: Request,
    bearer_token: Optional[str] = Depends(oauth2_scheme)
) -> Optional[Dict[str, Any]]:
    """Retrieve authenticated user if valid token exists, else return None without raising error."""
    token = extract_token_from_request(request, bearer_token)
    if not token:
        return None
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None
        user_id = payload.get("sub")
        if not user_id:
            return None
        user = get_user_by_id(user_id)
        return user
    except Exception:
        return None


async def get_current_user(
    request: Request,
    bearer_token: Optional[str] = Depends(oauth2_scheme)
) -> Dict[str, Any]:
    """Enforce authentication requirement on protected endpoints."""
    token = extract_token_from_request(request, bearer_token)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_token(token)
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token subject.",
        )
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists.",
        )
    return user


async def get_current_municipal_user(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Enforce municipal or administrative authorization."""
    role = current_user.get("role", "citizen")
    if role not in ["municipal", "admin", "responder"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to municipal responders and administrators.",
        )
    return current_user


# ============================================================================
# SEED DEFAULT DEMO ACCOUNTS
# ============================================================================
def seed_default_users():
    """Ensure baseline test accounts exist for instant verification."""
    # 1. Municipal Command Officer
    municipal_email = "municipal@ghmc.gov.in"
    if not get_user_by_email(municipal_email):
        create_user(
            user_id="usr-ghmc-001",
            email=municipal_email,
            hashed_password=hash_password("NirvanaCommand2026!"),
            full_name="GHMC Disaster Response Officer",
            phone="+91-040-21111111",
            role="municipal",
            ward_id="w-001",
            is_verified=True,
        )

    # 2. Citizen User
    citizen_email = "citizen@nirvana.in"
    if not get_user_by_email(citizen_email):
        create_user(
            user_id="usr-cit-001",
            email=citizen_email,
            hashed_password=hash_password("CitizenSafe2026!"),
            full_name="Rahul Kumar",
            phone="+91-9876543210",
            role="citizen",
            ward_id="w-001",
            is_verified=True,
        )
