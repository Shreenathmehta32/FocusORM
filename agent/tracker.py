"""
FocusORM — Active Window Tracker
Detects the currently active application and window title using Windows APIs.
"""

import time
import ctypes
import ctypes.wintypes
import logging

try:
    import win32gui
    import win32process
    import psutil
except ImportError:
    win32gui = None
    win32process = None
    psutil = None

from agent.config import normalize_app_name, is_browser

logger = logging.getLogger("FocusORM.tracker")


class WindowInfo:
    """Represents information about the currently active window."""

    __slots__ = (
        "process_name", "app_name", "window_title",
        "pid", "is_browser", "timestamp",
    )

    def __init__(
        self,
        process_name: str = "",
        app_name: str = "",
        window_title: str = "",
        pid: int = 0,
        is_browser_app: bool = False,
        timestamp: float = 0.0,
    ):
        self.process_name = process_name
        self.app_name = app_name
        self.window_title = window_title
        self.pid = pid
        self.is_browser = is_browser_app
        self.timestamp = timestamp or time.time()

    def __repr__(self):
        return (
            f"WindowInfo(app={self.app_name!r}, title={self.window_title!r}, "
            f"browser={self.is_browser})"
        )

    def __eq__(self, other):
        if not isinstance(other, WindowInfo):
            return False
        return (
            self.process_name == other.process_name
            and self.window_title == other.window_title
        )

    def has_changed_from(self, other: "WindowInfo") -> bool:
        """Check if the active window has meaningfully changed."""
        if other is None:
            return True
        # Different application is always a change
        if self.process_name != other.process_name:
            return True
        # Same app but significantly different window title = new session
        if self.window_title != other.window_title:
            return True
        return False


def get_active_window() -> WindowInfo:
    """
    Get information about the currently active (foreground) window.
    Uses win32gui + psutil on Windows.
    """
    if win32gui is None:
        logger.warning("pywin32 not installed — cannot detect active window")
        return WindowInfo(app_name="Unknown", window_title="pywin32 not installed")

    try:
        hwnd = win32gui.GetForegroundWindow()
        if not hwnd:
            return WindowInfo(app_name="Desktop", window_title="Desktop")

        window_title = win32gui.GetWindowText(hwnd) or ""
        _, pid = win32process.GetWindowThreadProcessId(hwnd)

        process_name = ""
        try:
            proc = psutil.Process(pid)
            process_name = proc.name()
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            process_name = "Unknown"

        app_name = normalize_app_name(process_name)
        is_browser_app = is_browser(process_name)

        return WindowInfo(
            process_name=process_name,
            app_name=app_name,
            window_title=window_title,
            pid=pid,
            is_browser_app=is_browser_app,
            timestamp=time.time(),
        )

    except Exception as e:
        logger.error(f"Error detecting active window: {e}")
        return WindowInfo(app_name="Unknown", window_title="Detection Error")


def get_idle_time_ms() -> int:
    """
    Get the system idle time in milliseconds using GetLastInputInfo.
    This is how long since the user last pressed a key or moved the mouse.
    """
    try:
        class LASTINPUTINFO(ctypes.Structure):
            _fields_ = [
                ("cbSize", ctypes.wintypes.UINT),
                ("dwTime", ctypes.wintypes.DWORD),
            ]

        lii = LASTINPUTINFO()
        lii.cbSize = ctypes.sizeof(LASTINPUTINFO)
        ctypes.windll.user32.GetLastInputInfo(ctypes.byref(lii))
        tick_count = ctypes.windll.kernel32.GetTickCount()
        idle_ms = tick_count - lii.dwTime
        return max(0, idle_ms)
    except Exception as e:
        logger.error(f"Error getting idle time: {e}")
        return 0
