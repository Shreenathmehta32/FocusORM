"""
FocusORM — Focus Session Service
Identifies uninterrupted productive sessions and calculates focus metrics.
"""

import sqlite3
import logging
from datetime import date
from agent.config import DB_PATH

logger = logging.getLogger("FocusORM.focus")


def get_focus_sessions(target_date: str = None, min_duration_minutes: int = 15) -> dict:
    """
    Identify focus sessions: consecutive productive sessions
    with minimal interruptions.

    A focus session is a stretch of productive work ≥ min_duration_minutes.
    """
    if not target_date:
        target_date = date.today().isoformat()

    min_duration_seconds = min_duration_minutes * 60

    try:
        conn = sqlite3.connect(str(DB_PATH))
        conn.row_factory = sqlite3.Row
        cursor = conn.execute(
            """
            SELECT id, start_time, end_time, duration_seconds,
                   application, domain, classification, category,
                   active_seconds, idle_seconds,
                   keyboard_count, click_count, files_modified
            FROM activity_sessions
            WHERE date(start_time) = ?
            ORDER BY start_time ASC
            """,
            (target_date,),
        )

        sessions = [dict(row) for row in cursor.fetchall()]
        conn.close()

        # Build focus sessions by grouping consecutive productive sessions
        focus_sessions = []
        current_focus = None

        for session in sessions:
            is_productive = session["classification"] == "PRODUCTIVE"
            is_neutral_short = (
                session["classification"] == "NEUTRAL"
                and session["duration_seconds"] < 120  # Allow brief neutral gaps
            )

            if is_productive or (current_focus and is_neutral_short):
                if current_focus is None:
                    current_focus = {
                        "start_time": session["start_time"],
                        "end_time": session["end_time"],
                        "duration_seconds": 0,
                        "active_seconds": 0,
                        "sessions": [],
                        "applications": set(),
                        "domains": set(),
                    }

                current_focus["end_time"] = session["end_time"]
                current_focus["duration_seconds"] += session["duration_seconds"]
                current_focus["active_seconds"] += session["active_seconds"]
                current_focus["sessions"].append(session)
                current_focus["applications"].add(session["application"])
                if session["domain"]:
                    current_focus["domains"].add(session["domain"])
            else:
                # Non-productive session breaks the focus streak
                if current_focus and current_focus["duration_seconds"] >= min_duration_seconds:
                    focus_sessions.append(_finalize_focus(current_focus))
                current_focus = None

        # Don't forget the last focus session
        if current_focus and current_focus["duration_seconds"] >= min_duration_seconds:
            focus_sessions.append(_finalize_focus(current_focus))

        # Calculate aggregate metrics
        total_focus = sum(f["duration_seconds"] for f in focus_sessions)
        longest = max((f["duration_seconds"] for f in focus_sessions), default=0)
        avg_focus = total_focus / len(focus_sessions) if focus_sessions else 0

        # Context switches: count application changes
        context_switches = 0
        prev_app = None
        for session in sessions:
            if prev_app and session["application"] != prev_app:
                context_switches += 1
            prev_app = session["application"]

        return {
            "date": target_date,
            "focus_sessions": focus_sessions,
            "total_focus_seconds": round(total_focus, 1),
            "total_focus_formatted": _fmt(total_focus),
            "longest_focus_seconds": round(longest, 1),
            "longest_focus_formatted": _fmt(longest),
            "average_focus_seconds": round(avg_focus, 1),
            "average_focus_formatted": _fmt(avg_focus),
            "focus_session_count": len(focus_sessions),
            "context_switches": context_switches,
        }

    except Exception as e:
        logger.error(f"Failed to calculate focus sessions: {e}")
        return {
            "date": target_date, "focus_sessions": [],
            "total_focus_seconds": 0, "total_focus_formatted": "0m",
            "longest_focus_seconds": 0, "longest_focus_formatted": "0m",
            "average_focus_seconds": 0, "average_focus_formatted": "0m",
            "focus_session_count": 0, "context_switches": 0,
        }


def _finalize_focus(focus: dict) -> dict:
    """Clean up a focus session for API response."""
    return {
        "start_time": focus["start_time"],
        "end_time": focus["end_time"],
        "duration_seconds": round(focus["duration_seconds"], 1),
        "duration_formatted": _fmt(focus["duration_seconds"]),
        "active_seconds": round(focus["active_seconds"], 1),
        "session_count": len(focus["sessions"]),
        "applications": sorted(focus["applications"]),
        "domains": sorted(focus["domains"]),
    }


def _fmt(seconds: float) -> str:
    if seconds < 60:
        return f"{int(seconds)}s"
    m = int(seconds / 60)
    if m < 60:
        return f"{m}m"
    h = m // 60
    r = m % 60
    return f"{h}h {r}m" if r else f"{h}h"
