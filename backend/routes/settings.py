"""FocusORM — Settings Route"""

import json
from fastapi import APIRouter
from pydantic import BaseModel
from agent.config import SETTINGS_PATH, CONFIG_DIR, load_settings

router = APIRouter(tags=["Settings"])


class SettingsUpdate(BaseModel):
    tracking_enabled: bool | None = None
    track_applications: bool | None = None
    track_websites: bool | None = None
    track_interaction_metrics: bool | None = None
    track_coding_metrics: bool | None = None
    enable_groq: bool | None = None
    idle_threshold_seconds: int | None = None
    data_retention_days: int | None = None
    privacy_mode: str | None = None


@router.get("/settings")
async def get_settings():
    """Get current settings."""
    return load_settings()


@router.post("/settings")
async def update_settings(update: SettingsUpdate):
    """Update settings."""
    current = load_settings()

    # Apply non-None updates
    updates = update.model_dump(exclude_none=True)
    current.update(updates)

    # Save to file
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    with open(SETTINGS_PATH, "w") as f:
        json.dump(current, f, indent=2)

    return {"status": "updated", "settings": current}
