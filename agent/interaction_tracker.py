"""
FocusORM — Interaction Tracker
Aggregates keyboard and mouse activity counts WITHOUT logging actual keystrokes.
Privacy-first: only counts events, never stores what was typed or clicked.
"""

import threading
import time
import logging

logger = logging.getLogger("FocusORM.interaction")

# pynput is optional — gracefully degrade if unavailable
try:
    from pynput import keyboard, mouse
    PYNPUT_AVAILABLE = True
except ImportError:
    PYNPUT_AVAILABLE = False
    logger.warning("pynput not installed — interaction tracking disabled")


class InteractionMetrics:
    """Holds aggregate interaction counts for a time window."""

    __slots__ = (
        "keyboard_count", "mouse_move_count", "click_count",
        "scroll_count", "start_time",
    )

    def __init__(self):
        self.keyboard_count = 0
        self.mouse_move_count = 0
        self.click_count = 0
        self.scroll_count = 0
        self.start_time = time.time()

    def reset(self):
        """Reset all counters for a new aggregation window."""
        self.keyboard_count = 0
        self.mouse_move_count = 0
        self.click_count = 0
        self.scroll_count = 0
        self.start_time = time.time()

    def total_events(self) -> int:
        return (
            self.keyboard_count + self.mouse_move_count
            + self.click_count + self.scroll_count
        )

    def activity_level(self) -> str:
        """Categorize activity level based on event counts."""
        elapsed = max(1, time.time() - self.start_time)
        events_per_minute = (self.total_events() / elapsed) * 60

        if events_per_minute > 120:
            return "high"
        elif events_per_minute > 40:
            return "medium"
        elif events_per_minute > 5:
            return "low"
        else:
            return "none"

    def to_dict(self) -> dict:
        return {
            "keyboard_count": self.keyboard_count,
            "mouse_move_count": self.mouse_move_count,
            "click_count": self.click_count,
            "scroll_count": self.scroll_count,
            "total_events": self.total_events(),
            "activity_level": self.activity_level(),
        }

    def copy(self) -> "InteractionMetrics":
        """Create a snapshot of current metrics."""
        m = InteractionMetrics()
        m.keyboard_count = self.keyboard_count
        m.mouse_move_count = self.mouse_move_count
        m.click_count = self.click_count
        m.scroll_count = self.scroll_count
        m.start_time = self.start_time
        return m


class InteractionTracker:
    """
    Tracks aggregate keyboard/mouse activity using pynput listeners.

    PRIVACY GUARANTEE:
    - Never stores actual keystrokes
    - Never stores mouse coordinates
    - Only maintains integer counters
    """

    def __init__(self):
        self._lock = threading.Lock()
        self._metrics = InteractionMetrics()
        self._keyboard_listener = None
        self._mouse_listener = None
        self._running = False
        self._move_throttle_time = 0.0

    def start(self):
        """Start listening for keyboard and mouse events."""
        if not PYNPUT_AVAILABLE:
            logger.warning("Cannot start interaction tracker — pynput unavailable")
            return

        if self._running:
            return

        self._running = True

        # Keyboard listener — only counts presses, NEVER records the key
        self._keyboard_listener = keyboard.Listener(
            on_press=self._on_key_press,
        )
        self._keyboard_listener.daemon = True
        self._keyboard_listener.start()

        # Mouse listener — counts clicks, scrolls, and throttled movement
        self._mouse_listener = mouse.Listener(
            on_click=self._on_click,
            on_scroll=self._on_scroll,
            on_move=self._on_move,
        )
        self._mouse_listener.daemon = True
        self._mouse_listener.start()

        logger.info("Interaction tracker started (aggregate counts only)")

    def stop(self):
        """Stop all listeners."""
        self._running = False
        if self._keyboard_listener:
            self._keyboard_listener.stop()
            self._keyboard_listener = None
        if self._mouse_listener:
            self._mouse_listener.stop()
            self._mouse_listener = None
        logger.info("Interaction tracker stopped")

    def _on_key_press(self, key):
        """Count keyboard press. NEVER stores the actual key."""
        # Intentionally ignoring the 'key' parameter — privacy first
        with self._lock:
            self._metrics.keyboard_count += 1

    def _on_click(self, x, y, button, pressed):
        """Count mouse clicks. Ignores coordinates and button identity."""
        if pressed:
            with self._lock:
                self._metrics.click_count += 1

    def _on_scroll(self, x, y, dx, dy):
        """Count scroll events. Ignores coordinates and direction."""
        with self._lock:
            self._metrics.scroll_count += 1

    def _on_move(self, x, y):
        """
        Count mouse movement. Throttled to avoid thousands of events.
        Ignores actual coordinates — only increments a counter.
        """
        now = time.time()
        # Throttle: count at most one move event per 0.5 seconds
        if now - self._move_throttle_time < 0.5:
            return
        self._move_throttle_time = now
        with self._lock:
            self._metrics.mouse_move_count += 1

    def get_metrics(self) -> InteractionMetrics:
        """Get a snapshot of current metrics (thread-safe)."""
        with self._lock:
            return self._metrics.copy()

    def get_and_reset(self) -> InteractionMetrics:
        """Get current metrics and reset counters for next window."""
        with self._lock:
            snapshot = self._metrics.copy()
            self._metrics.reset()
            return snapshot
