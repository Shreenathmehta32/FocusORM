"""
FocusORM — Coding Activity Tracker
Monitors file system events (created, modified, saved) without reading file contents.
Privacy: only counts events and records filenames, never reads file data.
"""

import os
import time
import threading
import logging
from pathlib import Path

logger = logging.getLogger("FocusORM.coding")

try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
    WATCHDOG_AVAILABLE = True
except ImportError:
    WATCHDOG_AVAILABLE = False
    Observer = None
    FileSystemEventHandler = object
    logger.warning("watchdog not installed — coding activity tracking disabled")


# File extensions that indicate code/project files
CODE_EXTENSIONS = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".cpp", ".c", ".h",
    ".cs", ".go", ".rs", ".rb", ".php", ".swift", ".kt", ".scala",
    ".html", ".css", ".scss", ".sass", ".less", ".vue", ".svelte",
    ".json", ".yaml", ".yml", ".toml", ".xml", ".sql", ".sh", ".bat",
    ".ps1", ".md", ".txt", ".cfg", ".ini", ".env", ".gitignore",
    ".dockerfile", ".r", ".jl", ".dart", ".lua", ".zig",
}


class CodingMetrics:
    """Holds aggregate coding activity counts."""

    def __init__(self):
        self.files_created = 0
        self.files_modified = 0
        self.files_deleted = 0
        self.total_events = 0
        self.start_time = time.time()

    def reset(self):
        self.files_created = 0
        self.files_modified = 0
        self.files_deleted = 0
        self.total_events = 0
        self.start_time = time.time()

    def to_dict(self) -> dict:
        return {
            "files_created": self.files_created,
            "files_modified": self.files_modified,
            "files_deleted": self.files_deleted,
            "total_events": self.total_events,
        }

    def copy(self) -> "CodingMetrics":
        m = CodingMetrics()
        m.files_created = self.files_created
        m.files_modified = self.files_modified
        m.files_deleted = self.files_deleted
        m.total_events = self.total_events
        m.start_time = self.start_time
        return m


class _CodingEventHandler(FileSystemEventHandler):
    """Watches for file events without reading contents."""

    def __init__(self, metrics: CodingMetrics, lock: threading.Lock):
        super().__init__()
        self._metrics = metrics
        self._lock = lock
        self._last_event_time = {}

    def _is_code_file(self, path: str) -> bool:
        ext = os.path.splitext(path)[1].lower()
        return ext in CODE_EXTENSIONS

    def _should_ignore(self, path: str) -> bool:
        """Ignore non-code files and noisy directories."""
        lower = path.lower()
        ignore_patterns = (
            "node_modules", ".git", "__pycache__", ".venv",
            "venv", ".idea", ".vs", "dist", "build",
            ".next", ".nuxt", "target",
        )
        return any(p in lower for p in ignore_patterns)

    def _deduplicate(self, path: str) -> bool:
        """Prevent counting the same file event multiple times within 2 seconds."""
        now = time.time()
        if path in self._last_event_time:
            if now - self._last_event_time[path] < 2.0:
                return True
        self._last_event_time[path] = now
        return False

    def on_created(self, event):
        if event.is_directory:
            return
        if self._should_ignore(event.src_path):
            return
        if not self._is_code_file(event.src_path):
            return
        if self._deduplicate(f"created:{event.src_path}"):
            return
        with self._lock:
            self._metrics.files_created += 1
            self._metrics.total_events += 1

    def on_modified(self, event):
        if event.is_directory:
            return
        if self._should_ignore(event.src_path):
            return
        if not self._is_code_file(event.src_path):
            return
        if self._deduplicate(f"modified:{event.src_path}"):
            return
        with self._lock:
            self._metrics.files_modified += 1
            self._metrics.total_events += 1

    def on_deleted(self, event):
        if event.is_directory:
            return
        if self._should_ignore(event.src_path):
            return
        if not self._is_code_file(event.src_path):
            return
        if self._deduplicate(f"deleted:{event.src_path}"):
            return
        with self._lock:
            self._metrics.files_deleted += 1
            self._metrics.total_events += 1


class CodingTracker:
    """
    Monitors coding-related file activity using watchdog.
    Privacy: never reads file contents, only counts events.
    """

    def __init__(self):
        self._lock = threading.Lock()
        self._metrics = CodingMetrics()
        self._observer = None
        self._running = False
        self._watched_paths: set[str] = set()

    def start(self, watch_paths: list[str] | None = None):
        """Start watching common project directories."""
        if not WATCHDOG_AVAILABLE:
            logger.warning("Cannot start coding tracker — watchdog unavailable")
            return

        if self._running:
            return

        # Default watch paths: user's common project locations
        if watch_paths is None:
            home = Path.home()
            candidates = [
                home / "Documents",
                home / "Projects",
                home / "Desktop",
                home / "repos",
                home / "dev",
                home / "code",
                home / "OneDrive" / "Desktop",
            ]
            watch_paths = [str(p) for p in candidates if p.exists()]

        if not watch_paths:
            logger.info("No project directories found to watch")
            return

        self._observer = Observer()
        handler = _CodingEventHandler(self._metrics, self._lock)

        for path in watch_paths:
            if os.path.isdir(path):
                try:
                    self._observer.schedule(handler, path, recursive=True)
                    self._watched_paths.add(path)
                    logger.debug(f"Watching: {path}")
                except Exception as e:
                    logger.warning(f"Failed to watch {path}: {e}")

        if self._watched_paths:
            self._observer.daemon = True
            self._observer.start()
            self._running = True
            logger.info(
                f"Coding tracker started, watching {len(self._watched_paths)} dirs"
            )

    def stop(self):
        """Stop the file system observer."""
        if self._observer and self._running:
            self._observer.stop()
            self._observer.join(timeout=5)
            self._running = False
            logger.info("Coding tracker stopped")

    def get_metrics(self) -> CodingMetrics:
        """Get a snapshot of current metrics."""
        with self._lock:
            return self._metrics.copy()

    def get_and_reset(self) -> CodingMetrics:
        """Get metrics and reset for next window."""
        with self._lock:
            snapshot = self._metrics.copy()
            self._metrics.reset()
            return snapshot
