"""FocusORM — Focus Route"""

from datetime import date
from fastapi import APIRouter, Query
from backend.services.focus_service import get_focus_sessions

router = APIRouter(tags=["Focus"])


@router.get("/focus")
async def focus_sessions(
    target_date: str = Query(None, description="Date in YYYY-MM-DD format"),
):
    """Get focus session analysis."""
    if target_date is None:
        target_date = date.today().isoformat()
    return get_focus_sessions(target_date=target_date)
