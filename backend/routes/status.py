"""FocusORM — Status Route"""

from fastapi import APIRouter
from agent.main import get_agent

router = APIRouter(tags=["Status"])


@router.get("/status")
async def get_status():
    """Get current agent status: running state, current app, classification, etc."""
    agent = get_agent()
    return agent.get_status()
