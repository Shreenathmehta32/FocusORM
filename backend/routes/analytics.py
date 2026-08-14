"""FocusORM — Analytics Route"""

from datetime import date
from fastapi import APIRouter, Query
from backend.services.analytics_service import (
    get_daily_summary, get_hourly_breakdown, get_weekly_summary,
)
from backend.services.inactivity_service import get_inactivity_analysis

router = APIRouter(tags=["Analytics"])


@router.get("/analytics/daily")
async def daily_analytics(
    target_date: str = Query(None, description="Date in YYYY-MM-DD format"),
):
    """Get detailed daily analytics."""
    if target_date is None:
        target_date = date.today().isoformat()
    summary = get_daily_summary(target_date)
    hourly = get_hourly_breakdown(target_date)
    inactivity = get_inactivity_analysis(target_date)

    return {
        "summary": summary,
        "hourly": hourly,
        "inactivity": inactivity,
    }


@router.get("/analytics/weekly")
async def weekly_analytics():
    """Get weekly analytics (last 7 days)."""
    return get_weekly_summary()


@router.get("/analytics/hourly")
async def hourly_analytics(
    target_date: str = Query(None, description="Date in YYYY-MM-DD format"),
):
    """Get hourly productivity breakdown."""
    if target_date is None:
        target_date = date.today().isoformat()
    return get_hourly_breakdown(target_date)
