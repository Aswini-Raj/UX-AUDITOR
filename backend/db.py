"""
db.py — SQLite Database Layer
Handles schema creation, user auth persistence, and audit session storage.
No external database server required — file-based SQLite.
"""
import os
import sqlite3
import json
from pathlib import Path
from contextlib import contextmanager

DB_PATH = os.path.join(os.path.dirname(__file__), os.getenv("SQLITE_DB_PATH", "ux_auditor.db"))


@contextmanager
def get_conn():
    """Context-managed SQLite connection with row_factory for dict-like access."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """Create all tables if they don't exist (idempotent)."""
    with get_conn() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                name          TEXT    NOT NULL,
                email         TEXT    UNIQUE NOT NULL,
                password_hash TEXT    NOT NULL,
                created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
            );

            CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

            CREATE TABLE IF NOT EXISTS audit_sessions (
                task_id      TEXT PRIMARY KEY,
                url          TEXT    NOT NULL,
                goal         TEXT    NOT NULL,
                status       TEXT    NOT NULL DEFAULT 'initialized',
                progress     INTEGER NOT NULL DEFAULT 0,
                phase        TEXT    NOT NULL DEFAULT 'initializing',
                result_json  TEXT,
                created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
                updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
            );
        """)
    print("[DB] SQLite schema ready →", DB_PATH)


# ── User Operations ──────────────────────────────────────────────────────────

def create_user(name: str, email: str, password_hash: str) -> dict:
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
            (name, email, password_hash)
        )
        row = conn.execute("SELECT id, name, email FROM users WHERE email = ?", (email,)).fetchone()
        return dict(row)


def get_user_by_email(email: str):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        return dict(row) if row else None


def seed_default_user(pwd_context):
    """Seed a default demo user if not already present."""
    with get_conn() as conn:
        exists = conn.execute("SELECT id FROM users WHERE email = 'aswi@gmail.com'").fetchone()
        if not exists:
            hashed = pwd_context.hash("12345678")
            conn.execute(
                "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
                ("Aswini", "aswi@gmail.com", hashed)
            )
            print("[DB] Seeded default user: aswi@gmail.com / 12345678")


# ── Audit Session Operations ──────────────────────────────────────────────────

def upsert_session(task_id: str, url: str, goal: str):
    """Create a new audit session record."""
    with get_conn() as conn:
        conn.execute(
            """INSERT OR REPLACE INTO audit_sessions (task_id, url, goal, status, progress, phase)
               VALUES (?, ?, ?, 'initialized', 0, 'initializing')""",
            (task_id, url, goal)
        )


def update_session_progress(task_id: str, status: str, progress: int, phase: str):
    with get_conn() as conn:
        conn.execute(
            """UPDATE audit_sessions
               SET status=?, progress=?, phase=?, updated_at=datetime('now')
               WHERE task_id=?""",
            (status, progress, phase, task_id)
        )


def save_session_result(task_id: str, result: dict):
    """Persist full result JSON when audit completes."""
    with get_conn() as conn:
        conn.execute(
            """UPDATE audit_sessions
               SET status='completed', progress=100, phase='completed',
                   result_json=?, updated_at=datetime('now')
               WHERE task_id=?""",
            (json.dumps(result), task_id)
        )


def get_session(task_id: str) -> dict | None:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM audit_sessions WHERE task_id = ?", (task_id,)).fetchone()
        if not row:
            return None
        d = dict(row)
        if d.get("result_json"):
            d["result"] = json.loads(d["result_json"])
        return d


def get_latest_completed() -> dict | None:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM audit_sessions WHERE status='completed' ORDER BY updated_at DESC LIMIT 1"
        ).fetchone()
        if not row:
            return None
        d = dict(row)
        if d.get("result_json"):
            d["result"] = json.loads(d["result_json"])
        return d


def list_sessions(limit: int = 20) -> list:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT task_id, url, goal, status, progress, phase, created_at FROM audit_sessions ORDER BY created_at DESC LIMIT ?",
            (limit,)
        ).fetchall()
        return [dict(r) for r in rows]
