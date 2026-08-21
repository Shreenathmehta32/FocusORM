"""
FocusORM — Agent Main Loop
The core tracking orchestrator. Polls the active window, detects changes,
manages sessions, and coordinates all tracking subsystems.
"""

import time
import signal
import logging
import threading
from datetime import datetime

from agent.config import (
    POLL_INTERVAL_SECONDS,
    AGGREGATION_INTERVAL_SECONDS,
    load_settings,
)
from agent.tracker import get_active_window, WindowInfo
from agent.idle_detector import IdleDetector
from agent.interaction_tracker import InteractionTracker
from agent.coding_tracker import CodingTracker
from agent.session_manager import SessionManager
from classifier.local_classifier import LocalClassifier
from classifier.sanitizer import sanitize_window_title, extract_domain

logger = logging.getLogger("FocusORM.agent")


class FocusOSAgent:
    """
    The main FocusORM tracking agent.
    Runs a polling loop that detects the active window, idle state,
    interaction metrics, and coding activity.
    """

    def __init__(self):
        self.settings = load_settings()
        self._running = False
        self._paused = False

        # Subsystems
        self.session_manager = SessionManager()
        self.idle_detector = IdleDetector(
            threshold_seconds=self.settings.get("idle_threshold_seconds", 300)
        )
        self.interaction_tracker = InteractionTracker()
        self.coding_tracker = CodingTracker()
        self.classifier = LocalClassifier(
            groq_enabled=self.settings.get("enable_groq", False)
        )

        # State
        self._last_window: WindowInfo | None = None
        self._last_aggregation_time = time.time()
        self._current_browser_info: dict | None = None
        self._lock = threading.Lock()

        # Statistics
        self.start_time = 0.0
        self.total_sessions = 0
        self.total_polls = 0

    @property
    def is_running(self) -> bool:
        return self._running

    @property
    def is_paused(self) -> bool:
        return self._paused

    def get_status(self) -> dict:
        """Get current agent status for the API."""
        with self._lock:
            status = {
                "running": self._running,
                "paused": self._paused,
                "uptime_seconds": round(time.time() - self.start_time, 1) if self.start_time else 0,
                "total_sessions": self.total_sessions,
                "total_polls": self.total_polls,
                "current_application": None,
                "current_window_title": None,
                "current_classification": None,
                "current_category": None,
                "current_session_duration": 0,
                "current_activity_level": "none",
                "is_idle": self.idle_detector.is_idle,
                "browser_domain": None,
            }

            if self.session_manager.current_session:
                session = self.session_manager.current_session
                status["current_application"] = session.application
                status["current_window_title"] = sanitize_window_title(
                    session.window_title, session.application
                )
                status["current_classification"] = session.classification
                status["current_category"] = session.category
                status["current_session_duration"] = round(
                    session.duration_seconds, 1
                )
                status["browser_domain"] = session.domain

            metrics = self.interaction_tracker.get_metrics()
            status["current_activity_level"] = metrics.activity_level()

            return status

    def update_browser_info(self, info: dict):
        """
        Receive browser tab info from the browser extension.
        Called by the FastAPI endpoint when the extension reports a tab change.
        """
        with self._lock:
            self._current_browser_info = info
            logger.debug(f"Browser info updated: {info.get('domain', '?')}")

    def pause(self):
        """Pause tracking."""
        self._paused = True
        logger.info("Tracking paused")

    def resume(self):
        """Resume tracking."""
        self._paused = False
        logger.info("Tracking resumed")

    def start(self):
        """Start the tracking agent in a background thread."""
        if self._running:
            return

        self._running = True
        self.start_time = time.time()

        # Recover any orphaned sessions from crashes
        self.session_manager.recover_crash()

        # Start subsystems
        if self.settings.get("track_interaction_metrics", True):
            self.interaction_tracker.start()

        if self.settings.get("track_coding_metrics", True):
            self.coding_tracker.start()

        # Start the main loop in a thread
        self._thread = threading.Thread(
            target=self._main_loop, daemon=True, name="FocusORM-agent"
        )
        self._thread.start()
        logger.info("FocusORM agent started")

    def stop(self):
        """Stop the tracking agent gracefully."""
        logger.info("Stopping FocusORM agent...")
        self._running = False

        # Finalize current session
        if self.session_manager.current_session:
            self._flush_metrics_to_session()
            self.session_manager.end_session()

        # Stop subsystems
        self.interaction_tracker.stop()
        self.coding_tracker.stop()

        logger.info("FocusORM agent stopped")

    def _main_loop(self):
        """
        The core polling loop.
        Every POLL_INTERVAL seconds:
        1. Get active window
        2. Check idle state
        3. If window changed → finalize old session, start new
        4. Classify the activity
        5. Periodically flush interaction metrics
        """
        logger.info("Agent main loop started")

        while self._running:
            try:
                if self._paused:
                    time.sleep(1)
                    continue

                self.total_polls += 1

                # 1. Get current active window
                window = get_active_window()

                # 2. Check idle state
                idle_state = self.idle_detector.update()
                if self.session_manager.current_session:
                    self.session_manager.update_idle_state(idle_state["is_idle"])

                # 3. Check for window change
                if window.has_changed_from(self._last_window):
                    # Flush metrics before ending session
                    self._flush_metrics_to_session()

                    # End old session, start new
                    completed, new_session = (
                        self.session_manager.handle_window_change(window)
                    )

                    if completed:
                        self.total_sessions += 1

                    # Reset idle detector for new session
                    self.idle_detector.reset()

                    # Enrich with browser info if applicable
                    if window.is_browser and self._current_browser_info:
                        new_session.domain = self._current_browser_info.get("domain", "")
                        new_session.page_title = self._current_browser_info.get("title", "")

                    # Classify the new session
                    self._classify_session(new_session)

                    self._last_window = window

                # 4. Check if browser info has updated (tab change without app change)
                elif (
                    window.is_browser
                    and self._current_browser_info
                    and self.session_manager.current_session
                ):
                    current = self.session_manager.current_session
                    new_domain = self._current_browser_info.get("domain", "")
                    if new_domain and new_domain != current.domain:
                        # Tab changed within browser — treat as new session
                        self._flush_metrics_to_session()
                        completed, new_session = (
                            self.session_manager.handle_window_change(window)
                        )
                        if completed:
                            self.total_sessions += 1

                        self.idle_detector.reset()
                        new_session.domain = new_domain
                        new_session.page_title = self._current_browser_info.get("title", "")
                        self._classify_session(new_session)
                        self._last_window = window

                # 5. Periodic metrics aggregation + live DB upsert
                now = time.time()
                if now - self._last_aggregation_time >= AGGREGATION_INTERVAL_SECONDS:
                    self._flush_metrics_to_session()
                    # Write current session to DB so dashboard can see live data
                    self.session_manager.upsert_live_session()
                    self._last_aggregation_time = now

                # Sleep until next poll
                time.sleep(POLL_INTERVAL_SECONDS)

            except Exception as e:
                logger.error(f"Error in main loop: {e}", exc_info=True)
                time.sleep(POLL_INTERVAL_SECONDS)

        logger.info("Agent main loop ended")

    def _classify_session(self, session):
        """Classify the current session using the local classifier."""
        try:
            result = self.classifier.classify(
                app_name=session.application,
                window_title=session.window_title,
                domain=session.domain or "",
                page_title=session.page_title or "",
            )
            session.classification = result.classification
            session.category = result.category
            session.confidence = result.confidence
        except Exception as e:
            logger.error(f"Classification error: {e}")

    def _flush_metrics_to_session(self):
        """Flush accumulated interaction and coding metrics to the current session."""
        session = self.session_manager.current_session
        if not session:
            return

        # Interaction metrics
        if self.settings.get("track_interaction_metrics", True):
            metrics = self.interaction_tracker.get_and_reset()
            session.update_interaction(metrics.to_dict())

        # Coding metrics
        if self.settings.get("track_coding_metrics", True):
            coding = self.coding_tracker.get_and_reset()
            session.update_coding(coding.to_dict())


# Global agent instance (shared between agent thread and FastAPI)
_agent_instance: FocusOSAgent | None = None


def get_agent() -> FocusOSAgent:
    """Get or create the global agent instance."""
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = FocusOSAgent()
    return _agent_instance
