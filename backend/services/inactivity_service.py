"""
FocusORM — Inactivity / Low-Engagement Detection Service
Detects potentially inactive study sessions using multiple signals.
Uses careful, non-judgmental language (spec §150).

IMPORTANT RULES (spec §120, §22):
- Low mouse activity alone ≠ fake study
- Reading can have low keyboard/mouse and still be productive
- Debugging can have low activity and still be productive
- Low activity != waste, always
"""

import sqlite3
import logging
from datetime import date
from agent.config import DB_PATH

logger = logging.getLogger("FocusORM.inactivity")


def get_inactivity_analysis(target_date: str = None) -> dict:
    """
    Analyze sessions for potential low-engagement periods.
    Returns sessions that show signs of inactivity despite an app being open.

    Uses multi-signal analysis (spec §21):
    - High idle ratio
    - Very low keyboard + mouse
    - No file activity
    - Long duration with minimal interaction
    """
    if not target_date:
        target_date = date.today().isoformat()

    try:
        conn = sqlite3.connect(str(DB_PATH))
        conn.row_factory = sqlite3.Row
        cursor = conn.execute(
            """
            SELECT id, start_time, end_time, duration_seconds,
                   application, domain, classification, category,
                   active_seconds, idle_seconds,
                   keyboard_count, mouse_move_count, click_count,
                   scroll_count, files_modified
            FROM activity_sessions
            WHERE date(start_time) = ?
            AND duration_seconds > 300
            ORDER BY start_time ASC
            """,
            (target_date,),
        )

        sessions = [dict(row) for row in cursor.fetchall()]
        conn.close()

        low_engagement_sessions = []
        total_potential_inactive = 0.0

        for session in sessions:
            engagement = _calculate_engagement(session)

            if engagement["level"] in ("very_low", "low"):
                session_info = {
                    "id": session["id"],
                    "start_time": session["start_time"],
                    "end_time": session["end_time"],
                    "duration_seconds": round(session["duration_seconds"], 1),
                    "duration_formatted": _fmt(session["duration_seconds"]),
                    "application": session["application"],
                    "domain": session["domain"],
                    "classification": session["classification"],
                    "engagement_level": engagement["level"],
                    "engagement_score": engagement["score"],
                    "idle_ratio": engagement["idle_ratio"],
                    "signals": engagement["signals"],
                    # Non-judgmental description (spec §150)
                    "description": _generate_description(session, engagement),
                }
                low_engagement_sessions.append(session_info)
                total_potential_inactive += session["idle_seconds"]

        # Summary
        most_affected_app = _most_common(
            [s["application"] for s in low_engagement_sessions]
        )
        longest_inactive = max(
            (s["duration_seconds"] for s in low_engagement_sessions), default=0
        )

        return {
            "date": target_date,
            "low_engagement_sessions": low_engagement_sessions,
            "total_potential_inactive_seconds": round(total_potential_inactive, 1),
            "total_potential_inactive_formatted": _fmt(total_potential_inactive),
            "session_count": len(low_engagement_sessions),
            "most_affected_application": most_affected_app,
            "longest_inactive_seconds": round(longest_inactive, 1),
            "longest_inactive_formatted": _fmt(longest_inactive),
        }

    except Exception as e:
        logger.error(f"Failed to analyze inactivity: {e}")
        return {
            "date": target_date, "low_engagement_sessions": [],
            "total_potential_inactive_seconds": 0,
            "total_potential_inactive_formatted": "0m",
            "session_count": 0, "most_affected_application": None,
            "longest_inactive_seconds": 0, "longest_inactive_formatted": "0m",
        }


def _calculate_engagement(session: dict) -> dict:
    """
    Calculate an engagement score for a session using multiple signals.

    Score components (conceptual, spec §123):
    - Keyboard activity:  30%
    - Mouse activity:     15%
    - File activity:      30%
    - Click/scroll:       15%
    - Idle ratio:         10% (penalty)
    """
    duration = max(session["duration_seconds"], 1)
    duration_minutes = duration / 60

    # Normalize metrics per minute
    kb_per_min = session["keyboard_count"] / duration_minutes
    mouse_per_min = session["mouse_move_count"] / duration_minutes
    clicks_per_min = session["click_count"] / duration_minutes
    scroll_per_min = session["scroll_count"] / duration_minutes
    idle_ratio = session["idle_seconds"] / duration if duration > 0 else 0

    signals = []

    # Keyboard score (0-1)
    kb_score = min(1.0, kb_per_min / 30)  # 30+ keys/min = full score
    if kb_per_min < 1:
        signals.append("Very low keyboard activity")

    # Mouse score (0-1)
    mouse_score = min(1.0, mouse_per_min / 10)
    if mouse_per_min < 0.5 and clicks_per_min < 0.5:
        signals.append("Very low mouse activity")

    # File activity score (0-1)
    file_score = min(1.0, session["files_modified"] / 3)  # 3+ files = full
    if session["files_modified"] == 0 and session["classification"] == "PRODUCTIVE":
        if session["category"] == "CODING":
            signals.append("No file modifications during coding session")

    # Click/scroll score (0-1)
    interaction_score = min(1.0, (clicks_per_min + scroll_per_min) / 5)

    # Idle penalty
    if idle_ratio > 0.6:
        signals.append(f"High idle ratio ({idle_ratio:.0%})")
    if idle_ratio > 0.8:
        signals.append("Mostly idle during session")

    # Weighted engagement score
    engagement_score = (
        kb_score * 0.30
        + mouse_score * 0.15
        + file_score * 0.30
        + interaction_score * 0.15
        + (1 - idle_ratio) * 0.10
    )
    engagement_score = round(engagement_score, 2)

    # Determine level
    if engagement_score >= 0.5:
        level = "high"
    elif engagement_score >= 0.3:
        level = "medium"
    elif engagement_score >= 0.15:
        level = "low"
    else:
        level = "very_low"

    # IMPORTANT: Don't flag reading/watching as inactive (spec §120)
    # If the category suggests passive consumption, raise the threshold
    passive_categories = {"READING", "LEARNING", "VIDEO", "RESEARCH"}
    if session["category"] in passive_categories and engagement_score >= 0.1:
        if level in ("low", "very_low"):
            level = "medium"
            signals.append("Note: Low interaction may be normal for reading/learning")

    return {
        "score": engagement_score,
        "level": level,
        "idle_ratio": round(idle_ratio, 2),
        "signals": signals,
    }


def _generate_description(session: dict, engagement: dict) -> str:
    """
    Generate a non-judgmental description of the low-engagement session.
    Uses careful language per spec §150.
    """
    app = session["application"]
    duration = _fmt(session["duration_seconds"])
    idle = _fmt(session["idle_seconds"])

    if engagement["level"] == "very_low":
        return (
            f"{app} was open for {duration} with very low engagement. "
            f"Approximately {idle} appeared idle. "
            f"This may indicate the application was left open without active use."
        )
    else:
        return (
            f"{app} showed low engagement over {duration}. "
            f"This could indicate passive use, thinking time, "
            f"or the application being in the background."
        )


def _most_common(items: list) -> str | None:
    if not items:
        return None
    counts = {}
    for item in items:
        counts[item] = counts.get(item, 0) + 1
    return max(counts, key=counts.get)


def _fmt(seconds: float) -> str:
    if seconds < 60:
        return f"{int(seconds)}s"
    m = int(seconds / 60)
    if m < 60:
        return f"{m}m"
    h = m // 60
    r = m % 60
    return f"{h}h {r}m" if r else f"{h}h"
