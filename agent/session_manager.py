"""
FocusORM — Session Manager
Creates, updates, and finalizes activity sessions.
A session represents a continuous period of using one application/window.
"""

import time
import uuid
import logging
import sqlite3
from datetime import datetime, timezone

from agent.config import MIN_SESSION_DURATION_SECONDS, DB_PATH
from agent.tracker import WindowInfo

logger = logging.getLogger("FocusORM.session")


class ActivitySession:
    """Represents one continuous period of application/window usage."""

    def __init__(self, window_info: WindowInfo):
        self.id = str(uuid.uuid4())
        self.start_time = time.time()
        self.end_time: float | None = None
        self.application = window_info.app_name
        self.process_name = window_info.process_name
        self.window_title = window_info.window_title
        self.is_browser = window_info.is_browser
        self.domain: str | None = None
        self.page_title: str | None = None

        # Classification (filled in by classifier)
        self.classification = "UNKNOWN"
        self.category = "UNKNOWN"
        self.confidence = 0.0

        # Interaction metrics (accumulated during session)
        self.keyboard_count = 0
        self.mouse_move_count = 0
        self.click_count = 0
        self.scroll_count = 0

        # Idle tracking
        self.active_seconds = 0.0
        self.idle_seconds = 0.0

        # Coding metrics
        self.files_created = 0
        self.files_modified = 0
        self.files_deleted = 0

    @property
    def duration_seconds(self) -> float:
        end = self.end_time or time.time()
        return max(0, end - self.start_time)

    @property
    def start_datetime(self) -> datetime:
        return datetime.fromtimestamp(self.start_time, tz=timezone.utc)

    @property
    def end_datetime(self) -> datetime | None:
        if self.end_time:
            return datetime.fromtimestamp(self.end_time, tz=timezone.utc)
        return None

    def finalize(self):
        """Mark session as complete."""
        if self.end_time is None:
            self.end_time = time.time()

    def is_too_short(self) -> bool:
        return self.duration_seconds < MIN_SESSION_DURATION_SECONDS

    def update_interaction(self, metrics_dict: dict):
        """Add interaction metrics from the tracker."""
        self.keyboard_count += metrics_dict.get("keyboard_count", 0)
        self.mouse_move_count += metrics_dict.get("mouse_move_count", 0)
        self.click_count += metrics_dict.get("click_count", 0)
        self.scroll_count += metrics_dict.get("scroll_count", 0)

    def update_coding(self, coding_dict: dict):
        """Add coding metrics from the coding tracker."""
        self.files_created += coding_dict.get("files_created", 0)
        self.files_modified += coding_dict.get("files_modified", 0)
        self.files_deleted += coding_dict.get("files_deleted", 0)

    def update_idle(self, active_secs: float, idle_secs: float):
        """Update active/idle time accounting."""
        self.active_seconds = active_secs
        self.idle_seconds = idle_secs

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "start_time": self.start_datetime.isoformat(),
            "end_time": self.end_datetime.isoformat() if self.end_datetime else None,
            "duration_seconds": round(self.duration_seconds, 1),
            "application": self.application,
            "process_name": self.process_name,
            "window_title": self.window_title,
            "is_browser": self.is_browser,
            "domain": self.domain,
            "page_title": self.page_title,
            "classification": self.classification,
            "category": self.category,
            "confidence": self.confidence,
            "keyboard_count": self.keyboard_count,
            "mouse_move_count": self.mouse_move_count,
            "click_count": self.click_count,
            "scroll_count": self.scroll_count,
            "active_seconds": round(self.active_seconds, 1),
            "idle_seconds": round(self.idle_seconds, 1),
            "files_created": self.files_created,
            "files_modified": self.files_modified,
            "files_deleted": self.files_deleted,
        }


class SessionManager:
    """
    Manages the lifecycle of activity sessions.
    Creates new sessions on app/window changes, finalizes and persists completed ones.
    """

    def __init__(self):
        self.current_session: ActivitySession | None = None
        self._session_active_start: float = 0.0
        self._session_idle_accumulated: float = 0.0
        self._was_idle: bool = False
        self._idle_started_at: float = 0.0
        self._init_db()

    def _init_db(self):
        """Ensure the database and tables exist."""
        try:
            conn = sqlite3.connect(str(DB_PATH))
            conn.execute("PRAGMA journal_mode=WAL")
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
            conn.commit()
            conn.close()
            logger.info(f"Database initialized at {DB_PATH}")
        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")

    def start_session(self, window_info: WindowInfo) -> ActivitySession:
        """Start a new activity session."""
        session = ActivitySession(window_info)
        self.current_session = session
        self._session_active_start = time.time()
        self._session_idle_accumulated = 0.0
        self._was_idle = False
        logger.debug(
            f"Session started: {session.application} — {session.window_title[:50]}"
        )
        return session

    def end_session(self) -> ActivitySession | None:
        """
        Finalize and persist the current session.
        Returns the completed session or None if too short.
        """
        if self.current_session is None:
            return None

        session = self.current_session
        session.finalize()

        # Calculate active vs idle time
        if self._was_idle and self._idle_started_at:
            self._session_idle_accumulated += time.time() - self._idle_started_at
        session.idle_seconds = self._session_idle_accumulated
        session.active_seconds = max(
            0, session.duration_seconds - session.idle_seconds
        )

        self.current_session = None

        if session.is_too_short():
            logger.debug(
                f"Session discarded (too short: {session.duration_seconds:.1f}s)"
            )
            return None

        # Save to database
        self._save_session(session)
        logger.debug(
            f"Session saved: {session.application} — "
            f"{session.duration_seconds:.0f}s "
            f"(active: {session.active_seconds:.0f}s, idle: {session.idle_seconds:.0f}s)"
        )
        return session

    def update_idle_state(self, is_idle: bool):
        """Track idle time within the current session."""
        now = time.time()
        if is_idle and not self._was_idle:
            # Transition to idle
            self._idle_started_at = now
            self._was_idle = True
        elif not is_idle and self._was_idle:
            # Transition to active
            if self._idle_started_at:
                self._session_idle_accumulated += now - self._idle_started_at
            self._was_idle = False

    def handle_window_change(
        self, new_window: WindowInfo
    ) -> tuple[ActivitySession | None, ActivitySession]:
        """
        Handle an application/window change.
        Returns (completed_session, new_session).
        """
        completed = self.end_session()
        new_session = self.start_session(new_window)
        return completed, new_session

    def recover_crash(self):
        """
        On startup, check for sessions that were never finalized
        (due to crash or unexpected shutdown) and close them.
        """
        try:
            conn = sqlite3.connect(str(DB_PATH))
            cursor = conn.execute(
                "SELECT id, start_time FROM activity_sessions WHERE end_time IS NULL"
            )
            orphans = cursor.fetchall()
            for session_id, start_time in orphans:
                conn.execute(
                    """
                    UPDATE activity_sessions
                    SET end_time = start_time,
                        duration_seconds = 0,
                        classification = 'UNKNOWN',
                        category = 'CRASH_RECOVERY'
                    WHERE id = ?
                    """,
                    (session_id,),
                )
                logger.info(f"Recovered orphaned session: {session_id}")
            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"Crash recovery failed: {e}")

    def upsert_live_session(self):
        """
        Write (INSERT OR REPLACE) the current in-progress session to the DB
        so the dashboard can see live data even before the session ends.
        Called periodically by the agent's aggregation loop.
        """
        session = self.current_session
        if not session:
            return

        # Calculate current active/idle time snapshot
        now = time.time()
        idle_accum = self._session_idle_accumulated
        if self._was_idle and self._idle_started_at:
            idle_accum += now - self._idle_started_at
        active_secs = max(0, session.duration_seconds - idle_accum)

        try:
            conn = sqlite3.connect(str(DB_PATH))
            conn.execute(
                """
                INSERT OR REPLACE INTO activity_sessions (
                    id, start_time, end_time, duration_seconds,
                    application, process_name, window_title,
                    is_browser, domain, page_title,
                    classification, category, confidence,
                    keyboard_count, mouse_move_count, click_count, scroll_count,
                    active_seconds, idle_seconds,
                    files_created, files_modified, files_deleted
                ) VALUES (
                    ?, ?, NULL, ?,
                    ?, ?, ?,
                    ?, ?, ?,
                    ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?,
                    ?, ?, ?
                )
                """,
                (
                    session.id,
                    session.start_datetime.isoformat(),
                    round(session.duration_seconds, 1),
                    session.application,
                    session.process_name,
                    session.window_title,
                    1 if session.is_browser else 0,
                    session.domain,
                    session.page_title,
                    session.classification,
                    session.category,
                    round(session.confidence, 3),
                    session.keyboard_count,
                    session.mouse_move_count,
                    session.click_count,
                    session.scroll_count,
                    round(active_secs, 1),
                    round(idle_accum, 1),
                    session.files_created,
                    session.files_modified,
                    session.files_deleted,
                ),
            )
            conn.commit()
            conn.close()
            logger.debug(
                f"Live upsert: {session.application} "
                f"({session.duration_seconds:.0f}s, {session.classification})"
            )
        except Exception as e:
            logger.error(f"Failed to upsert live session: {e}")

    def _save_session(self, session: ActivitySession):
        """Persist a completed session to SQLite."""
        try:
            conn = sqlite3.connect(str(DB_PATH))
            conn.execute(
                """
                INSERT OR REPLACE INTO activity_sessions (
                    id, start_time, end_time, duration_seconds,
                    application, process_name, window_title,
                    is_browser, domain, page_title,
                    classification, category, confidence,
                    keyboard_count, mouse_move_count, click_count, scroll_count,
                    active_seconds, idle_seconds,
                    files_created, files_modified, files_deleted
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                )
                """,
                (
                    session.id,
                    session.start_datetime.isoformat(),
                    session.end_datetime.isoformat() if session.end_datetime else None,
                    round(session.duration_seconds, 1),
                    session.application,
                    session.process_name,
                    session.window_title,
                    1 if session.is_browser else 0,
                    session.domain,
                    session.page_title,
                    session.classification,
                    session.category,
                    round(session.confidence, 3),
                    session.keyboard_count,
                    session.mouse_move_count,
                    session.click_count,
                    session.scroll_count,
                    round(session.active_seconds, 1),
                    round(session.idle_seconds, 1),
                    session.files_created,
                    session.files_modified,
                    session.files_deleted,
                ),
            )
            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"Failed to save session: {e}")
