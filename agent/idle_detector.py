"""
FocusORM — Idle Detector
Detects whether the user is actively using the computer or idle.
Uses Windows GetLastInputInfo API.
"""

import time
import logging
from agent.config import IDLE_THRESHOLD_SECONDS
from agent.tracker import get_idle_time_ms

logger = logging.getLogger("FocusORM.idle")


class IdleDetector:
    """
    Tracks user idle state using system-level input detection.
    Does NOT monitor what the user types — only whether any input occurred.
    """

    def __init__(self, threshold_seconds: int = IDLE_THRESHOLD_SECONDS):
        self.threshold_seconds = threshold_seconds
        self.is_idle = False
        self.idle_start_time: float | None = None
        self.total_idle_seconds: float = 0.0
        self._last_check_time: float = time.time()

    def update(self) -> dict:
        """
        Check current idle state and return status.
        Returns dict with:
            - is_idle: bool
            - idle_seconds: current idle duration in seconds
            - became_idle: True if just transitioned to idle
            - became_active: True if just transitioned to active
        """
        now = time.time()
        idle_ms = get_idle_time_ms()
        idle_seconds = idle_ms / 1000.0
        was_idle = self.is_idle

        became_idle = False
        became_active = False

        if idle_seconds >= self.threshold_seconds:
            if not was_idle:
                # Just became idle
                self.is_idle = True
                self.idle_start_time = now - idle_seconds
                became_idle = True
                logger.debug(f"User became idle (idle for {idle_seconds:.0f}s)")
        else:
            if was_idle:
                # Just became active again
                self.is_idle = False
                if self.idle_start_time:
                    idle_duration = now - self.idle_start_time
                    self.total_idle_seconds += idle_duration
                    logger.debug(
                        f"User became active after {idle_duration:.0f}s idle"
                    )
                self.idle_start_time = None
                became_active = True

        self._last_check_time = now

        return {
            "is_idle": self.is_idle,
            "idle_seconds": idle_seconds,
            "became_idle": became_idle,
            "became_active": became_active,
        }

    def get_session_idle_seconds(self) -> float:
        """Get total idle seconds accumulated in current tracking period."""
        extra = 0.0
        if self.is_idle and self.idle_start_time:
            extra = time.time() - self.idle_start_time
        return self.total_idle_seconds + extra

    def reset(self):
        """Reset idle tracking for a new session."""
        self.total_idle_seconds = 0.0
        self.idle_start_time = None
        self.is_idle = False
