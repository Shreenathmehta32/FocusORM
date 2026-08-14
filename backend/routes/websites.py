"""FocusORM — Websites Route"""

from datetime import date
from fastapi import APIRouter, Query
from backend.services.analytics_service import get_website_stats

router = APIRouter(tags=["Websites"])


@router.get("/websites")
async def websites(
    target_date: str = Query(None, description="Date in YYYY-MM-DD format"),
):
    """Get website usage breakdown."""
    if target_date is None:
        target_date = date.today().isoformat()
    return get_website_stats(target_date=target_date)
