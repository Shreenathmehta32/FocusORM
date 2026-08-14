"""FocusORM — Privacy Route"""

from fastapi import APIRouter
from agent.main import get_agent

router = APIRouter(tags=["Privacy"])


@router.get("/privacy")
async def privacy_center():
    """
    Privacy center showing exactly what data is collected and where it goes.
    Implements spec §58 — complete transparency.
    """
    agent = get_agent()
    ai_log = agent.classifier.get_ai_log(limit=20)
    groq_stats = {}
    if agent.classifier.groq:
        groq_stats = agent.classifier.groq.get_stats()

    return {
        "data_storage": {
            "activity_data": "LOCAL — SQLite on your computer",
            "database_location": "~/.FocusORM/FocusORM.db",
            "screenshots": "NOT COLLECTED",
            "keyboard_contents": "NOT COLLECTED — only aggregate counts",
            "clipboard": "NOT COLLECTED",
            "microphone": "NOT USED",
            "webcam": "NOT USED",
            "public_ip": "NOT COLLECTED",
            "personal_identity": "NOT COLLECTED",
        },
        "groq_ai": {
            "status": "ENABLED" if agent.classifier._groq_enabled else "DISABLED",
            "purpose": "Classification of unknown websites/applications only",
            "data_sent": [
                "Application name",
                "Website domain",
                "Sanitized page title",
            ],
            "data_NOT_sent": [
                "Screenshots",
                "Actual keystrokes",
                "IP address",
                "Username or computer name",
                "File contents",
                "Browsing history",
                "Personal messages",
                "Passwords or tokens",
            ],
            "stats": groq_stats,
        },
        "recent_ai_requests": ai_log,
        "principles": [
            "All data stays on your laptop",
            "AI is optional and uses minimal sanitized data",
            "You can pause tracking at any time",
            "You can delete all data at any time",
            "No cloud sync, no external analytics",
            "No telemetry or usage reporting",
        ],
    }


@router.post("/privacy/pause")
async def pause_tracking():
    """Pause all tracking."""
    agent = get_agent()
    agent.pause()
    return {"status": "paused"}


@router.post("/privacy/resume")
async def resume_tracking():
    """Resume tracking."""
    agent = get_agent()
    agent.resume()
    return {"status": "resumed"}


@router.delete("/privacy/data")
async def delete_data(target_date: str = None):
    """
    Delete activity data.
    If target_date is provided, delete that day's data.
    Otherwise, delete all data.
    """
    import sqlite3
    from agent.config import DB_PATH

    try:
        conn = sqlite3.connect(str(DB_PATH))
        if target_date:
            conn.execute(
                "DELETE FROM activity_sessions WHERE date(start_time) = ?",
                (target_date,),
            )
            msg = f"Data for {target_date} deleted"
        else:
            conn.execute("DELETE FROM activity_sessions")
            conn.execute("DELETE FROM daily_summaries")
            conn.execute("DELETE FROM ai_requests")
            msg = "All data deleted"
        conn.commit()
        conn.close()
        return {"status": "deleted", "message": msg}
    except Exception as e:
        return {"status": "error", "message": str(e)}
