"""
FocusORM — AI Settings Routes
Manages AI provider configuration (API keys) through the dashboard.

Endpoints:
  GET    /api/settings/ai        — returns provider status + masked key (NEVER the real key)
  POST   /api/settings/ai        — saves/updates the provider API key
  POST   /api/settings/ai/test   — tests the saved key against the provider
  DELETE /api/settings/ai        — removes the saved key and disables AI
"""

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.credential_store import (
    save_credential,
    load_credential,
    delete_credential,
    is_configured,
    masked_key,
)

logger = logging.getLogger("FocusORM.ai_settings")

router = APIRouter(tags=["AI Settings"])

SUPPORTED_PROVIDERS = {"groq"}


# ─── Request / Response models ────────────────────────────────────────────────

class AISettingsSave(BaseModel):
    provider: str = "groq"
    api_key: str


class AISettingsResponse(BaseModel):
    provider: str
    configured: bool
    masked_key: str


class TestConnectionResponse(BaseModel):
    success: bool
    message: str


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _hot_reload_groq(api_key: str | None):
    """
    Hot-reload the GroqClassifier in the running agent without a restart.
    api_key=None disables Groq.
    """
    try:
        from agent.main import get_agent
        agent = get_agent()
        if hasattr(agent, "classifier") and agent.classifier is not None:
            agent.classifier.reload_groq(api_key)
    except Exception as e:
        logger.warning("Could not hot-reload Groq classifier: %s", e)


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.get("/settings/ai", response_model=AISettingsResponse)
async def get_ai_settings():
    """
    Return the current AI provider status.
    The real API key is NEVER included in the response.
    """
    configured = is_configured("groq")
    return AISettingsResponse(
        provider="groq",
        configured=configured,
        masked_key=masked_key("groq") if configured else "",
    )


@router.post("/settings/ai", response_model=AISettingsResponse)
async def save_ai_settings(payload: AISettingsSave):
    """
    Save the AI provider API key securely in ~/.FocusORM/credentials.json.
    The key is validated for basic format before saving.
    Hot-reloads the classifier so no restart is required.
    """
    provider = payload.provider.lower().strip()
    if provider not in SUPPORTED_PROVIDERS:
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")

    api_key = payload.api_key.strip()
    if not api_key:
        raise HTTPException(status_code=400, detail="API key must not be empty")

    # Basic format check for Groq keys (starts with "gsk_")
    if provider == "groq" and not api_key.startswith("gsk_"):
        raise HTTPException(
            status_code=400,
            detail="Invalid Groq API key format. Groq keys start with 'gsk_'.",
        )

    save_credential(provider, api_key)
    logger.info("AI provider configured: %s", provider)

    # Hot-reload the running classifier
    _hot_reload_groq(api_key)

    return AISettingsResponse(
        provider=provider,
        configured=True,
        masked_key=masked_key(provider),
    )


@router.post("/settings/ai/test", response_model=TestConnectionResponse)
async def test_ai_connection():
    """
    Test the currently saved API key by making a minimal real request to Groq.
    Returns success/failure without exposing the key.
    """
    if not is_configured("groq"):
        return TestConnectionResponse(
            success=False,
            message="No Groq API key configured. Please save a key first.",
        )

    api_key = load_credential("groq")

    try:
        from groq import Groq  # type: ignore
    except ImportError:
        return TestConnectionResponse(
            success=False,
            message="The 'groq' Python package is not installed. Run: pip install groq",
        )

    try:
        client = Groq(api_key=api_key)
        # Minimal test request — cheapest possible call
        client.chat.completions.create(
            messages=[{"role": "user", "content": "ping"}],
            model="llama-3.1-8b-instant",
            max_tokens=1,
        )
        logger.info("Groq connection test successful")
        return TestConnectionResponse(success=True, message="Groq connection successful.")

    except Exception as e:
        err = str(e)
        logger.warning("Groq connection test failed: %s", type(e).__name__)

        # Produce a user-friendly message without leaking internal details
        if "401" in err or "invalid_api_key" in err.lower() or "authentication" in err.lower():
            msg = "Invalid Groq API key. Please check your key at console.groq.com/keys."
        elif "429" in err or "rate_limit" in err.lower():
            msg = "Groq rate limit reached. Your key is valid — try again in a moment."
        elif "connect" in err.lower() or "network" in err.lower() or "timeout" in err.lower():
            msg = "Unable to connect to Groq. Check your internet connection."
        else:
            msg = "Groq connection failed. Check your API key and internet connection."

        return TestConnectionResponse(success=False, message=msg)


@router.delete("/settings/ai")
async def delete_ai_settings():
    """
    Remove the stored API key and disable AI classification.
    Hot-reloads the classifier so no restart is required.
    """
    if not is_configured("groq"):
        return {"status": "ok", "message": "No AI provider was configured."}

    delete_credential("groq")
    logger.info("AI provider configuration removed: groq")

    # Hot-reload to disable Groq in the running agent
    _hot_reload_groq(None)

    return {"status": "ok", "message": "Groq API key removed."}
