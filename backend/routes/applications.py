"""FocusORM — Applications Route"""

from datetime import date
from fastapi import APIRouter, Query
from backend.services.analytics_service import get_application_stats

router = APIRouter(tags=["Applications"])


@router.get("/applications")
async def applications(
    target_date: str = Query(None, description="Date in YYYY-MM-DD format"),
):
    """Get application usage breakdown."""
    if target_date is None:
        target_date = date.today().isoformat()
    return get_application_stats(target_date=target_date)
