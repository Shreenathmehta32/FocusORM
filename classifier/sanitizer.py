"""
FocusORM — Privacy Sanitization Pipeline
Strips all personal, sensitive, and unnecessary data before any external processing.
Implements the sanitization pipeline defined in spec §96.
"""

import re
import logging
from urllib.parse import urlparse, urlunparse

logger = logging.getLogger("FocusORM.sanitizer")

# ─── Patterns to strip from window titles ────────────────
PRIVATE_TITLE_PATTERNS = [
    # Email addresses
    re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+", re.IGNORECASE),
    # File paths with usernames
    re.compile(r"[A-Z]:\\Users\\[^\\]+", re.IGNORECASE),
    re.compile(r"/home/[^/]+", re.IGNORECASE),
    # IP addresses
    re.compile(r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b"),
    # UUIDs
    re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", re.IGNORECASE),
    # Long hex strings (tokens, hashes)
    re.compile(r"\b[0-9a-f]{32,}\b", re.IGNORECASE),
    # API keys / tokens (common patterns)
    re.compile(r"(sk|pk|api|key|token|secret|password|bearer)[-_]?[:\s=]?\s*\S+", re.IGNORECASE),
]

# ─── URL parameters to strip ─────────────────────────────
TRACKING_PARAMS = {
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "fbclid", "gclid", "gclsrc", "dclid", "msclkid",
    "mc_cid", "mc_eid", "ref", "referrer",
    "si", "feature", "app", "src", "source",
    "t", "s", "share", "ab_channel",
    "token", "auth", "session", "sid", "key",
    "ticket", "code", "state", "nonce",
}

# ─── Applications that should never have titles sent to AI ─
PRIVATE_APPS = {
    "whatsapp", "telegram", "signal", "messages",
    "keepass", "1password", "bitwarden", "lastpass",
    "banking", "finance",
}


def sanitize_url(url: str) -> tuple[str, str]:
    """
    Sanitize a URL by extracting only domain and safe path.
    Returns (domain, safe_path).

    Strips:
    - Query parameters (especially tracking)
    - Fragment identifiers
    - Authentication tokens
    - Session IDs
    """
    if not url:
        return ("", "")

    try:
        parsed = urlparse(url)
        domain = parsed.hostname or ""

        # Clean path: keep only the first 2 path segments
        path = parsed.path or ""
        segments = [s for s in path.split("/") if s]
        safe_path = "/" + "/".join(segments[:2]) if segments else ""

        # Remove any path segments that look like IDs or tokens
        safe_segments = []
        for seg in segments[:2]:
            # Skip segments that are long hex strings or UUIDs
            if re.match(r"^[0-9a-f]{16,}$", seg, re.IGNORECASE):
                continue
            if re.match(
                r"^[0-9a-f]{8}-[0-9a-f]{4}", seg, re.IGNORECASE
            ):
                continue
            safe_segments.append(seg)
        safe_path = "/" + "/".join(safe_segments) if safe_segments else ""

        return (domain.lower(), safe_path)

    except Exception:
        return ("", "")


def extract_domain(url: str) -> str:
    """Extract just the domain from a URL."""
    if not url:
        return ""
    try:
        parsed = urlparse(url)
        return (parsed.hostname or "").lower()
    except Exception:
        return ""


def sanitize_window_title(title: str, app_name: str = "") -> str:
    """
    Sanitize a window title by removing personal/sensitive information.
    Returns a cleaned title safe for storage and optional AI processing.
    """
    if not title:
        return ""

    sanitized = title

    # For private apps, return only the app name
    if app_name:
        app_lower = app_name.lower()
        for private_app in PRIVATE_APPS:
            if private_app in app_lower:
                return app_name

    # Remove private patterns
    for pattern in PRIVATE_TITLE_PATTERNS:
        sanitized = pattern.sub("[REDACTED]", sanitized)

    # Remove file paths
    sanitized = re.sub(
        r"[A-Z]:\\[^\s\-–—|]+", "[PATH]", sanitized, flags=re.IGNORECASE
    )
    sanitized = re.sub(r"~/[^\s\-–—|]+", "[PATH]", sanitized)

    # Clean up multiple spaces and redaction artifacts
    sanitized = re.sub(r"\s+", " ", sanitized).strip()
    sanitized = re.sub(r"\[REDACTED\]\s*\[REDACTED\]", "[REDACTED]", sanitized)

    # Truncate very long titles
    if len(sanitized) > 200:
        sanitized = sanitized[:200] + "..."

    return sanitized


def sanitize_page_title(title: str) -> str:
    """
    Sanitize a browser page title for storage/AI.
    Less aggressive than window title sanitization.
    """
    if not title:
        return ""

    sanitized = title

    # Remove email addresses
    sanitized = re.sub(
        r"[\w.+-]+@[\w-]+\.[\w.]+", "[EMAIL]", sanitized
    )

    # Remove tokens/keys that might appear in titles
    for pattern in PRIVATE_TITLE_PATTERNS[3:]:  # Skip email/path patterns
        sanitized = pattern.sub("[REDACTED]", sanitized)

    # Truncate
    if len(sanitized) > 200:
        sanitized = sanitized[:200] + "..."

    return sanitized.strip()


def create_groq_payload(
    application: str,
    domain: str = "",
    page_title: str = "",
) -> dict:
    """
    Create a minimal, sanitized payload for Groq classification.
    This is the ONLY data that leaves the user's machine.

    Per spec §97, §144, §145:
    - Only app name, domain, sanitized title
    - No username, IP, computer name, file contents, etc.
    """
    payload = {
        "application": application or "Unknown",
    }

    if domain:
        payload["domain"] = domain

    if page_title:
        # Double-sanitize the title before sending to AI
        clean_title = sanitize_page_title(page_title)
        if clean_title and "[REDACTED]" not in clean_title:
            payload["title"] = clean_title

    return payload


def is_private_app(app_name: str) -> bool:
    """Check if an application is marked as private."""
    if not app_name:
        return False
    lower = app_name.lower()
    return any(p in lower for p in PRIVATE_APPS)
