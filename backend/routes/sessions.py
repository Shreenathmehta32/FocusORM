"""FocusORM — Sessions Route"""

from datetime import date
from fastapi import APIRouter, Query
from backend.services.analytics_service import get_sessions, get_today_summary

router = APIRouter(tags=["Sessions"])


@router.get("/today")
async def today():
    """Get today's productivity summary."""
    return get_today_summary()


@router.get("/sessions")
async def list_sessions(
    target_date: str = Query(None, description="Date in YYYY-MM-DD format"),
    limit: int = Query(200, ge=1, le=1000),
):
    """Get activity sessions, optionally filtered by date."""
    if target_date is None:
        target_date = date.today().isoformat()
    return get_sessions(target_date=target_date, limit=limit)
