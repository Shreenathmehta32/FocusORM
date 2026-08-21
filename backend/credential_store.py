"""
FocusORM — AI Credential Store
Manages AI provider API keys in ~/.FocusORM/credentials.json.

This file lives OUTSIDE the project directory (in the user's home),
so it is never committed to Git. Keys are never logged or returned
to the frontend in plaintext.
"""

import json
import logging
import os
import stat
from pathlib import Path

logger = logging.getLogger("FocusORM.credentials")

# ~/.FocusORM/credentials.json  — outside the Git repo
_CREDENTIALS_DIR = Path.home() / ".FocusORM"
_CREDENTIALS_PATH = _CREDENTIALS_DIR / "credentials.json"


def _load_all() -> dict:
    """Load the full credentials file. Returns {} on any error."""
    try:
        if _CREDENTIALS_PATH.exists():
            with open(_CREDENTIALS_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
    except (json.JSONDecodeError, IOError, OSError):
        pass
    return {}


def _save_all(data: dict) -> None:
    """Write the credentials file with restricted permissions."""
    _CREDENTIALS_DIR.mkdir(parents=True, exist_ok=True)
    with open(_CREDENTIALS_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    # Restrict to owner read/write only (effective on Unix; no-op on Windows but harmless)
    try:
        os.chmod(_CREDENTIALS_PATH, stat.S_IRUSR | stat.S_IWUSR)
    except (OSError, AttributeError):
        pass


def save_credential(provider: str, api_key: str) -> None:
    """
    Persist an API key for the given provider.
    Never logs the key value.
    """
    if not provider or not api_key:
        raise ValueError("Provider and api_key must not be empty")
    data = _load_all()
    data[provider.lower()] = {"api_key": api_key}
    _save_all(data)
    logger.info("Credential saved for provider: %s", provider)


def load_credential(provider: str) -> str | None:
    """
    Return the stored API key for the given provider, or None if not set.
    """
    data = _load_all()
    entry = data.get(provider.lower(), {})
    return entry.get("api_key") or None


def delete_credential(provider: str) -> None:
    """Remove the stored API key for the given provider."""
    data = _load_all()
    if provider.lower() in data:
        del data[provider.lower()]
        _save_all(data)
        logger.info("Credential removed for provider: %s", provider)


def is_configured(provider: str) -> bool:
    """Return True if a non-empty key is stored for the given provider."""
    key = load_credential(provider)
    return bool(key)


def masked_key(provider: str) -> str:
    """
    Return a masked representation of the stored key.
    Shows only the last 4 characters, e.g. '••••••••••••abcd'.
    Returns '' if not configured.
    """
    key = load_credential(provider)
    if not key:
        return ""
    visible = key[-4:] if len(key) >= 4 else key
    return "•" * 16 + visible
