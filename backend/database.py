"""
FocusORM — Database Module
Direct SQLite access for the FastAPI backend.
"""

import sqlite3
import logging
from contextlib import contextmanager
from agent.config import DB_PATH

logger = logging.getLogger("FocusORM.database")


@contextmanager
def get_db():
    """Context manager for database connections."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    """Initialize all database tables."""
    with get_db() as conn:
        # Activity sessions (created by session_manager, but ensure exists)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS activity_sessions (
                id TEXT PRIMARY KEY,
                start_time TEXT NOT NULL,
                end_time TEXT,
                duration_seconds REAL,
                application TEXT,
                process_name TEXT,
                window_title TEXT,
                is_browser INTEGER DEFAULT 0,
                domain TEXT,
                page_title TEXT,
                classification TEXT DEFAULT 'UNKNOWN',
                category TEXT DEFAULT 'UNKNOWN',
                confidence REAL DEFAULT 0.0,
                keyboard_count INTEGER DEFAULT 0,
                mouse_move_count INTEGER DEFAULT 0,
                click_count INTEGER DEFAULT 0,
                scroll_count INTEGER DEFAULT 0,
                active_seconds REAL DEFAULT 0.0,
                idle_seconds REAL DEFAULT 0.0,
                files_created INTEGER DEFAULT 0,
                files_modified INTEGER DEFAULT 0,
                files_deleted INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Daily summaries
        conn.execute("""
            CREATE TABLE IF NOT EXISTS daily_summaries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT UNIQUE NOT NULL,
                total_seconds REAL DEFAULT 0,
                active_seconds REAL DEFAULT 0,
                productive_seconds REAL DEFAULT 0,
                deep_work_seconds REAL DEFAULT 0,
                learning_seconds REAL DEFAULT 0,
                coding_seconds REAL DEFAULT 0,
                distraction_seconds REAL DEFAULT 0,
                idle_seconds REAL DEFAULT 0,
                neutral_seconds REAL DEFAULT 0,
                unknown_seconds REAL DEFAULT 0,
                session_count INTEGER DEFAULT 0,
                focus_session_count INTEGER DEFAULT 0,
                longest_focus_seconds REAL DEFAULT 0,
                context_switches INTEGER DEFAULT 0,
                productivity_score REAL DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Settings
        conn.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Indexes
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_sessions_start
            ON activity_sessions(start_time)
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_sessions_app
            ON activity_sessions(application)
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_sessions_classification
            ON activity_sessions(classification)
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_sessions_domain
            ON activity_sessions(domain)
        """)

        conn.commit()
        logger.info("Database tables initialized")
