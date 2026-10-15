import os
import re
import sqlite3
import time
from pathlib import Path

import bcrypt

DB_PATH = Path(os.getenv("STUDENTPAY_DB_PATH", "studentpay.db"))


def _connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with _connect() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash BLOB NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS login_attempts (
            username TEXT PRIMARY KEY,
            failed_count INTEGER NOT NULL DEFAULT 0,
            first_failed_at REAL NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS simulated_plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            currency_from TEXT NOT NULL,
            currency_to TEXT NOT NULL,
            amount REAL NOT NULL,
            result_summary TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS audit_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            event_type TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        """)
    try:
        os.chmod(DB_PATH, 0o600)
    except OSError:
        pass


def log_event(user_id, event_type):
    with _connect() as conn:
        conn.execute(
            "INSERT INTO audit_events(user_id, event_type) VALUES (?, ?)",
            (user_id, event_type),
        )


def create_user(username, password):
    if not re.fullmatch(r"[A-Za-z0-9_]{3,30}", username or ""):
        return False, "Username must be 3–30 characters: letters, numbers, or underscores."
    if not password or len(password) < 12:
        return False, "Password must be at least 12 characters."

    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    try:
        with _connect() as conn:
            conn.execute(
                "INSERT INTO users(username, password_hash) VALUES (?, ?)",
                (username, password_hash),
            )
        log_event(None, "account_created")
        return True, "Account created. You can now log in."
    except sqlite3.IntegrityError:
        return False, "That username is already in use."


def verify_user(username, password):
    now = time.time()
    with _connect() as conn:
        attempt = conn.execute(
            "SELECT * FROM login_attempts WHERE username = ?", (username,)
        ).fetchone()

        if attempt and attempt["failed_count"] >= 5 and now - attempt["first_failed_at"] < 900:
            return None

        user = conn.execute(
            "SELECT id, password_hash FROM users WHERE username = ?", (username,)
        ).fetchone()

        valid = bool(
            user and password and bcrypt.checkpw(password.encode("utf-8"), user["password_hash"])
        )

        if valid:
            conn.execute("DELETE FROM login_attempts WHERE username = ?", (username,))
            user_id = user["id"]
        else:
            if attempt and now - attempt["first_failed_at"] < 900:
                conn.execute(
                    "UPDATE login_attempts SET failed_count = failed_count + 1 WHERE username = ?",
                    (username,),
                )
            else:
                conn.execute(
                    """INSERT OR REPLACE INTO login_attempts
                       (username, failed_count, first_failed_at) VALUES (?, 1, ?)""",
                    (username, now),
                )
            user_id = None

    log_event(user_id, "login_success" if valid else "login_failed")
    return (user_id, username) if valid else None


def save_plan(user_id, currency_from, currency_to, amount, results):
    summary = " | ".join(
        f'{item["name"]}: estimated received {item["received"]:.2f}, fee {item["fee"]:.2f}'
        for item in results
    )
    with _connect() as conn:
        conn.execute(
            """INSERT INTO simulated_plans
               (user_id, currency_from, currency_to, amount, result_summary)
               VALUES (?, ?, ?, ?, ?)""",
            (user_id, currency_from, currency_to, amount, summary),
        )
    log_event(user_id, "simulated_comparison_saved")


def get_user_plans(user_id):
    with _connect() as conn:
        rows = conn.execute(
            """SELECT currency_from, currency_to, amount, result_summary, created_at
               FROM simulated_plans WHERE user_id = ? ORDER BY id DESC""",
            (user_id,),
        ).fetchall()
    return [dict(row) for row in rows]
