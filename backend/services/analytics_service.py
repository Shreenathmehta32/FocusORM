"""
FocusORM — Analytics Service
Calculates productivity metrics, daily summaries, and hourly breakdowns.
"""

import sqlite3
import logging
from datetime import datetime, date, timedelta
from agent.config import DB_PATH

logger = logging.getLogger("FocusORM.analytics")


def _get_conn():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def get_today_summary() -> dict:
    """Get today's aggregated productivity summary."""
    today = date.today().isoformat()
    return get_daily_summary(today)


def get_daily_summary(target_date: str) -> dict:
    """Get aggregated productivity summary for a specific date."""
    try:
        conn = _get_conn()
        cursor = conn.execute(
            """
            SELECT
                COUNT(*) as session_count,
                COALESCE(SUM(duration_seconds), 0) as total_seconds,
                COALESCE(SUM(active_seconds), 0) as active_seconds,
                COALESCE(SUM(idle_seconds), 0) as idle_seconds,
                COALESCE(SUM(CASE WHEN classification = 'PRODUCTIVE' THEN active_seconds ELSE 0 END), 0) as productive_seconds,
                COALESCE(SUM(CASE WHEN classification = 'DISTRACTION' THEN active_seconds ELSE 0 END), 0) as distraction_seconds,
                COALESCE(SUM(CASE WHEN classification = 'NEUTRAL' THEN active_seconds ELSE 0 END), 0) as neutral_seconds,
                COALESCE(SUM(CASE WHEN classification = 'UNKNOWN' THEN active_seconds ELSE 0 END), 0) as unknown_seconds,
                COALESCE(SUM(CASE WHEN category = 'CODING' THEN active_seconds ELSE 0 END), 0) as coding_seconds,
                COALESCE(SUM(CASE WHEN category = 'LEARNING' THEN active_seconds ELSE 0 END), 0) as learning_seconds,
                COALESCE(SUM(CASE WHEN category IN ('WRITING', 'READING', 'RESEARCH') THEN active_seconds ELSE 0 END), 0) as study_seconds,
                COALESCE(SUM(CASE WHEN category = 'SOCIAL_MEDIA' THEN active_seconds ELSE 0 END), 0) as social_media_seconds,
                COALESCE(SUM(CASE WHEN category = 'ENTERTAINMENT' THEN active_seconds ELSE 0 END), 0) as entertainment_seconds,
                COALESCE(SUM(keyboard_count), 0) as total_keyboard,
                COALESCE(SUM(click_count), 0) as total_clicks,
                COALESCE(SUM(files_modified), 0) as total_files_modified
            FROM activity_sessions
            WHERE date(start_time) = ?
            """,
            (target_date,),
        )
        row = cursor.fetchone()
        conn.close()

        if not row or row["session_count"] == 0:
            return _empty_summary(target_date)

        total = row["total_seconds"]
        active = row["active_seconds"]
        productive = row["productive_seconds"]

        # Productivity score (spec §32): productive active time / total active time
        productivity_score = 0
        if active > 0:
            productivity_score = round((productive / active) * 100, 1)

        # Deep work estimate: productive sessions > 15 min with high engagement
        deep_work = _estimate_deep_work(target_date)

        return {
            "date": target_date,
            "total_seconds": round(total, 1),
            "active_seconds": round(active, 1),
            "idle_seconds": round(row["idle_seconds"], 1),
            "productive_seconds": round(productive, 1),
            "distraction_seconds": round(row["distraction_seconds"], 1),
            "neutral_seconds": round(row["neutral_seconds"], 1),
            "unknown_seconds": round(row["unknown_seconds"], 1),
            "coding_seconds": round(row["coding_seconds"], 1),
            "learning_seconds": round(row["learning_seconds"], 1),
            "study_seconds": round(row["study_seconds"], 1),
            "social_media_seconds": round(row["social_media_seconds"], 1),
            "entertainment_seconds": round(row["entertainment_seconds"], 1),
            "deep_work_seconds": round(deep_work, 1),
            "session_count": row["session_count"],
            "productivity_score": productivity_score,
            "total_keyboard": row["total_keyboard"],
            "total_clicks": row["total_clicks"],
            "total_files_modified": row["total_files_modified"],
            "total_formatted": _format_duration(total),
            "active_formatted": _format_duration(active),
            "productive_formatted": _format_duration(productive),
            "distraction_formatted": _format_duration(row["distraction_seconds"]),
            "idle_formatted": _format_duration(row["idle_seconds"]),
            "deep_work_formatted": _format_duration(deep_work),
            "coding_formatted": _format_duration(row["coding_seconds"]),
            "learning_formatted": _format_duration(row["learning_seconds"]),
        }

    except Exception as e:
        logger.error(f"Failed to get daily summary: {e}")
        return _empty_summary(target_date)


def get_sessions(target_date: str = None, limit: int = 200) -> list[dict]:
    """Get activity sessions, optionally filtered by date."""
    try:
        conn = _get_conn()

        if target_date:
            cursor = conn.execute(
                """
                SELECT * FROM activity_sessions
                WHERE date(start_time) = ?
                ORDER BY start_time ASC
                LIMIT ?
                """,
                (target_date, limit),
            )
        else:
            cursor = conn.execute(
                """
                SELECT * FROM activity_sessions
                ORDER BY start_time DESC
                LIMIT ?
                """,
                (limit,),
            )

        sessions = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return sessions

    except Exception as e:
        logger.error(f"Failed to get sessions: {e}")
        return []


def get_application_stats(target_date: str = None) -> list[dict]:
    """Get application usage breakdown."""
    try:
        conn = _get_conn()
        date_filter = "WHERE date(start_time) = ?" if target_date else ""
        params = (target_date,) if target_date else ()

        cursor = conn.execute(
            f"""
            SELECT
                application,
                classification,
                category,
                COUNT(*) as session_count,
                COALESCE(SUM(duration_seconds), 0) as total_seconds,
                COALESCE(SUM(active_seconds), 0) as active_seconds,
                COALESCE(SUM(idle_seconds), 0) as idle_seconds,
                COALESCE(SUM(keyboard_count), 0) as keyboard_count,
                COALESCE(SUM(click_count), 0) as click_count
            FROM activity_sessions
            {date_filter}
            GROUP BY application
            ORDER BY total_seconds DESC
            """,
            params,
        )

        apps = []
        for row in cursor.fetchall():
            apps.append({
                "application": row["application"],
                "classification": row["classification"],
                "category": row["category"],
                "session_count": row["session_count"],
                "total_seconds": round(row["total_seconds"], 1),
                "active_seconds": round(row["active_seconds"], 1),
                "idle_seconds": round(row["idle_seconds"], 1),
                "total_formatted": _format_duration(row["total_seconds"]),
                "keyboard_count": row["keyboard_count"],
                "click_count": row["click_count"],
            })

        conn.close()
        return apps

    except Exception as e:
        logger.error(f"Failed to get app stats: {e}")
        return []


def get_website_stats(target_date: str = None) -> list[dict]:
    """Get website usage breakdown."""
    try:
        conn = _get_conn()
        date_filter = "AND date(start_time) = ?" if target_date else ""
        params = (target_date,) if target_date else ()

        cursor = conn.execute(
            f"""
            SELECT
                domain,
                classification,
                category,
                COUNT(*) as visit_count,
                COALESCE(SUM(duration_seconds), 0) as total_seconds,
                COALESCE(SUM(active_seconds), 0) as active_seconds
            FROM activity_sessions
            WHERE domain IS NOT NULL AND domain != ''
            {date_filter}
            GROUP BY domain
            ORDER BY total_seconds DESC
            """,
            params,
        )

        sites = []
        for row in cursor.fetchall():
            sites.append({
                "domain": row["domain"],
                "classification": row["classification"],
                "category": row["category"],
                "visit_count": row["visit_count"],
                "total_seconds": round(row["total_seconds"], 1),
                "active_seconds": round(row["active_seconds"], 1),
                "total_formatted": _format_duration(row["total_seconds"]),
            })

        conn.close()
        return sites

    except Exception as e:
        logger.error(f"Failed to get website stats: {e}")
        return []


def get_hourly_breakdown(target_date: str = None) -> list[dict]:
    """Get hourly productivity breakdown for charts."""
    if not target_date:
        target_date = date.today().isoformat()

    try:
        conn = _get_conn()
        hours = []

        for hour in range(24):
            hour_start = f"{target_date}T{hour:02d}:00:00"
            hour_end = f"{target_date}T{hour:02d}:59:59"

            cursor = conn.execute(
                """
                SELECT
                    COALESCE(SUM(CASE WHEN classification = 'PRODUCTIVE' THEN active_seconds ELSE 0 END), 0) as productive,
                    COALESCE(SUM(CASE WHEN classification = 'DISTRACTION' THEN active_seconds ELSE 0 END), 0) as distraction,
                    COALESCE(SUM(CASE WHEN classification = 'NEUTRAL' THEN active_seconds ELSE 0 END), 0) as neutral,
                    COALESCE(SUM(idle_seconds), 0) as idle
                FROM activity_sessions
                WHERE start_time >= ? AND start_time <= ?
                """,
                (hour_start, hour_end),
            )
            row = cursor.fetchone()

            hours.append({
                "hour": hour,
                "label": f"{hour:02d}:00",
                "productive": round(row["productive"] / 60, 1),
                "distraction": round(row["distraction"] / 60, 1),
                "neutral": round(row["neutral"] / 60, 1),
                "idle": round(row["idle"] / 60, 1),
            })

        conn.close()
        return hours

    except Exception as e:
        logger.error(f"Failed to get hourly breakdown: {e}")
        return []


def get_weekly_summary() -> list[dict]:
    """Get daily summaries for the past 7 days."""
    today = date.today()
    days = []
    for i in range(6, -1, -1):
        d = (today - timedelta(days=i)).isoformat()
        days.append(get_daily_summary(d))
    return days


def _estimate_deep_work(target_date: str) -> float:
    """
    Estimate deep work time: productive sessions with high engagement.
    Deep work = productive sessions > 15 min with meaningful interaction.
    """
    try:
        conn = _get_conn()
        cursor = conn.execute(
            """
            SELECT COALESCE(SUM(active_seconds), 0) as deep_work
            FROM activity_sessions
            WHERE date(start_time) = ?
            AND classification = 'PRODUCTIVE'
            AND duration_seconds > 900
            AND (keyboard_count > 50 OR click_count > 20 OR files_modified > 0)
            """,
            (target_date,),
        )
        row = cursor.fetchone()
        conn.close()
        return row["deep_work"] if row else 0.0
    except Exception:
        return 0.0


def _format_duration(seconds: float) -> str:
    """Format seconds into human-readable duration."""
    if seconds < 60:
        return f"{int(seconds)}s"
    minutes = int(seconds / 60)
    if minutes < 60:
        return f"{minutes}m"
    hours = minutes // 60
    remaining_mins = minutes % 60
    if remaining_mins == 0:
        return f"{hours}h"
    return f"{hours}h {remaining_mins}m"


def _empty_summary(target_date: str) -> dict:
    return {
        "date": target_date,
        "total_seconds": 0, "active_seconds": 0, "idle_seconds": 0,
        "productive_seconds": 0, "distraction_seconds": 0,
        "neutral_seconds": 0, "unknown_seconds": 0,
        "coding_seconds": 0, "learning_seconds": 0, "study_seconds": 0,
        "social_media_seconds": 0, "entertainment_seconds": 0,
        "deep_work_seconds": 0, "session_count": 0,
        "productivity_score": 0, "total_keyboard": 0,
        "total_clicks": 0, "total_files_modified": 0,
        "total_formatted": "0m", "active_formatted": "0m",
        "productive_formatted": "0m", "distraction_formatted": "0m",
        "idle_formatted": "0m", "deep_work_formatted": "0m",
        "coding_formatted": "0m", "learning_formatted": "0m",
    }
