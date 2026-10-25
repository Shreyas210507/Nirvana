"""SQLite database setup and query helpers for Nirvana authentication and persistence."""

import sqlite3
import os
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from pathlib import Path

logger = logging.getLogger("nirvana.db")

DB_DIR = Path(__file__).parent
DB_PATH = DB_DIR / "nirvana.db"


def get_db():
    """Get a SQLite database connection with row factory enabled."""
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    # Enable Write-Ahead Logging for better concurrency
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db():
    """Initialize database tables for users, sessions, and password resets."""
    conn = get_db()
    cursor = conn.cursor()

    # Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        hashed_password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT,
        role TEXT NOT NULL DEFAULT 'citizen',
        ward_id TEXT DEFAULT 'w-001',
        is_verified INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        last_login_at TEXT,
        language TEXT NOT NULL DEFAULT 'en'
    );
    """)

    # Auto-migrate language column if users table was created previously without it
    cursor.execute("PRAGMA table_info(users);")
    columns = [row["name"] for row in cursor.fetchall()]
    if "language" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN language TEXT NOT NULL DEFAULT 'en';")

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")

    # Refresh tokens / Sessions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        token_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        revoked INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # Password reset tokens table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        used INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    conn.commit()
    conn.close()
    logger.info(f"Database initialized at {DB_PATH}")


# ============================================================================
# USER OPERATIONS
# ============================================================================
def create_user(user_id: str, email: str, hashed_password: str, full_name: str,
                phone: Optional[str] = None, role: str = "citizen",
                ward_id: Optional[str] = "w-001", is_verified: bool = True,
                language: str = "en") -> Dict[str, Any]:
    """Insert a new user into the database."""
    conn = get_db()
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
    INSERT INTO users (id, email, hashed_password, full_name, phone, role, ward_id, is_verified, created_at, last_login_at, language)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, email.lower().strip(), hashed_password, full_name.strip(),
          phone, role, ward_id or "w-001", 1 if is_verified else 0, now_iso, now_iso, language or "en"))
    conn.commit()
    conn.close()
    return get_user_by_id(user_id)


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Retrieve a user by normalized email address."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email.lower().strip(),))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a user by unique ID."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None


def update_last_login(user_id: str) -> None:
    """Update user's last login timestamp."""
    conn = get_db()
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()
    cursor.execute("UPDATE users SET last_login_at = ? WHERE id = ?", (now_iso, user_id))
    conn.commit()
    conn.close()


def update_user_password(user_id: str, new_hashed_password: str) -> bool:
    """Update a user's password hash."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET hashed_password = ? WHERE id = ?", (new_hashed_password, user_id))
    rows_affected = cursor.rowcount
    conn.commit()
    conn.close()
    return rows_affected > 0


def update_user_profile(user_id: str, full_name: Optional[str] = None,
                        phone: Optional[str] = None, ward_id: Optional[str] = None,
                        language: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Update a user's profile details."""
    conn = get_db()
    cursor = conn.cursor()
    fields = []
    values = []
    if full_name is not None:
        fields.append("full_name = ?")
        values.append(full_name.strip())
    if phone is not None:
        fields.append("phone = ?")
        values.append(phone.strip())
    if ward_id is not None:
        fields.append("ward_id = ?")
        values.append(ward_id.strip())
    if language is not None:
        fields.append("language = ?")
        values.append(language.strip().lower())

    if not fields:
        conn.close()
        return get_user_by_id(user_id)

    values.append(user_id)
    query = f"UPDATE users SET {', '.join(fields)} WHERE id = ?"
    cursor.execute(query, tuple(values))
    conn.commit()
    conn.close()
    return get_user_by_id(user_id)


# ============================================================================
# SESSION & TOKEN OPERATIONS
# ============================================================================
def create_session(token_id: str, user_id: str, expires_at: datetime) -> None:
    """Register an active session/refresh token."""
    conn = get_db()
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
    INSERT INTO sessions (token_id, user_id, expires_at, created_at, revoked)
    VALUES (?, ?, ?, ?, 0)
    """, (token_id, user_id, expires_at.isoformat(), now_iso))
    conn.commit()
    conn.close()


def is_session_revoked(token_id: str) -> bool:
    """Check if a session token was revoked or expired."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT revoked, expires_at FROM sessions WHERE token_id = ?", (token_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return True
    if row["revoked"] == 1:
        return True
    return False


def revoke_session(token_id: str) -> None:
    """Revoke an active session token."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE sessions SET revoked = 1 WHERE token_id = ?", (token_id,))
    conn.commit()
    conn.close()


def revoke_all_user_sessions(user_id: str) -> None:
    """Revoke all sessions for a user (e.g. after password reset)."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE sessions SET revoked = 1 WHERE user_id = ?", (user_id,))
    conn.commit()
    conn.close()


# ============================================================================
# PASSWORD RESET OPERATIONS
# ============================================================================
def create_password_reset_token(token: str, user_id: str, expires_at: datetime) -> None:
    """Store a password reset token."""
    conn = get_db()
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
    INSERT INTO password_reset_tokens (token, user_id, expires_at, used, created_at)
    VALUES (?, ?, ?, 0, ?)
    """, (token, user_id, expires_at.isoformat(), now_iso))
    conn.commit()
    conn.close()


def get_password_reset_token(token: str) -> Optional[Dict[str, Any]]:
    """Retrieve a password reset token record."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM password_reset_tokens WHERE token = ?", (token,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None


def mark_password_reset_token_used(token: str) -> None:
    """Mark a password reset token as used."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE password_reset_tokens SET used = 1 WHERE token = ?", (token,))
    conn.commit()
    conn.close()
