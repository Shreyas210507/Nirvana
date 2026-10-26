"""SQLite database setup and query helpers for Nirvana authentication and persistence."""

import sqlite3
import os
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from pathlib import Path

logger = logging.getLogger("nirvana.db")

DB_DIR = Path(__file__).parent
DB_PATH = DB_DIR / "nirvana.db"


_db_initialized = False


def _init_tables(conn):
    """Execute CREATE TABLE IF NOT EXISTS statements."""
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

    # Community Reports table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'medium',
        description TEXT NOT NULL DEFAULT '',
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        ward_id TEXT NOT NULL,
        ward_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'submitted',
        confirmations INTEGER NOT NULL DEFAULT 0,
        submitted_at TEXT NOT NULL,
        language TEXT NOT NULL DEFAULT 'en'
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_reports_ward ON reports(ward_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);")
    conn.commit()


def get_db():
    """Get a SQLite database connection with row factory enabled."""
    global _db_initialized
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    # Enable Write-Ahead Logging for better concurrency
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA foreign_keys = ON;")
    if not _db_initialized:
        _db_initialized = True
        _init_tables(conn)
        seed_default_reports()
    return conn


def init_db():
    """Initialize database tables for users, sessions, password resets, and community reports."""
    conn = get_db()
    _init_tables(conn)
    seed_default_reports()
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


# ============================================================================
# COMMUNITY REPORTS OPERATIONS
# ============================================================================
def seed_default_reports() -> None:
    """Seed initial demonstration reports if table is currently empty."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM reports")
    row = cursor.fetchone()
    count = row["count"] if row else 0

    if count == 0:
        from app.mock_data import MOCK_REPORTS
        for r in MOCK_REPORTS:
            cursor.execute("""
            INSERT OR IGNORE INTO reports (id, type, severity, description, lat, lng, ward_id, ward_name, status, confirmations, submitted_at, language)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                r.id, r.type, r.severity, r.description,
                r.lat, r.lng, r.ward_id, r.ward_name,
                r.status, r.confirmations, r.submitted_at.isoformat(), r.language
            ))
        conn.commit()
        logger.info(f"Seeded {len(MOCK_REPORTS)} default demonstration community reports.")
    conn.close()


def create_report_record(
    report_id: str,
    report_type: str,
    severity: str,
    description: str,
    lat: float,
    lng: float,
    ward_id: str,
    ward_name: str,
    language: str = "en",
) -> Dict[str, Any]:
    """Insert a new citizen community report into the database."""
    conn = get_db()
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
    INSERT INTO reports (id, type, severity, description, lat, lng, ward_id, ward_name, status, confirmations, submitted_at, language)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'submitted', 0, ?, ?)
    """, (report_id, report_type, severity, description.strip(), lat, lng, ward_id, ward_name, now_iso, language))
    conn.commit()
    conn.close()
    return get_report_by_id(report_id) or {}


def get_report_by_id(report_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve single report record by ID."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM reports WHERE id = ?", (report_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None


def list_reports_records(
    ward_id: Optional[str] = None,
    report_type: Optional[str] = None,
    status: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Retrieve filtered community reports."""
    conn = get_db()
    cursor = conn.cursor()
    query = "SELECT * FROM reports WHERE 1=1"
    params = []

    if ward_id:
        query += " AND ward_id = ?"
        params.append(ward_id)
    if report_type:
        query += " AND type = ?"
        params.append(report_type)
    if status:
        query += " AND status = ?"
        params.append(status)

    query += " ORDER BY submitted_at DESC"
    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def confirm_report_record(report_id: str) -> Optional[Dict[str, Any]]:
    """Increment confirmation count for a report and promote status if verified."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT confirmations, status FROM reports WHERE id = ?", (report_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None

    new_count = row["confirmations"] + 1
    new_status = "confirmed" if new_count >= 3 and row["status"] == "submitted" else row["status"]

    cursor.execute("UPDATE reports SET confirmations = ?, status = ? WHERE id = ?", (new_count, new_status, report_id))
    conn.commit()
    conn.close()
    return get_report_by_id(report_id)


def get_active_reports_count() -> int:
    """Count of unresolved active reports."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM reports WHERE status != 'resolved'")
    row = cursor.fetchone()
    conn.close()
    return row["count"] if row else 0
