"""
FocusORM — Groq AI Classifier
Sends minimal sanitized payloads to Groq for unknown activity classification.
Only used when local rules cannot classify an activity.
"""

import os
import json
import logging
import time

logger = logging.getLogger("FocusORM.groq")

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    Groq = None
    GROQ_AVAILABLE = False
    logger.warning("groq package not installed — AI classification disabled")


SYSTEM_PROMPT = """You are a productivity classifier for a student's computer activity.
Given an application name, website domain, and/or page title, classify the activity.

Respond with ONLY valid JSON in this exact format:
{"classification": "PRODUCTIVE|NEUTRAL|DISTRACTION", "category": "<category>", "confidence": <0.0-1.0>}

Categories to use:
- CODING: Programming, development
- LEARNING: Educational content, courses, tutorials
- RESEARCH: Academic research, documentation
- WRITING: Notes, documents, essays
- READING: Reading articles, books, PDFs
- PROJECT_WORK: Project management, collaboration
- DESIGN: UI/UX, graphics
- DEVELOPMENT: Dev tools, deployment, DevOps
- COMMUNICATION: Email, chat, meetings
- AI_TOOL: AI assistants
- VIDEO: Video content (educational or entertainment)
- SOCIAL_MEDIA: Social networking
- ENTERTAINMENT: Movies, shows, gaming, casual browsing
- GAMING: Games
- SHOPPING: Online shopping
- NEWS: News sites
- SEARCH: Search engines
- SYSTEM: System utilities
- UNKNOWN: Cannot determine

Rules:
- YouTube with educational titles = PRODUCTIVE/LEARNING
- YouTube with entertainment titles = DISTRACTION/ENTERTAINMENT
- Reddit in programming subreddits = PRODUCTIVE/LEARNING
- Reddit in entertainment subreddits = DISTRACTION/SOCIAL_MEDIA
- AI tools (ChatGPT, Claude) = NEUTRAL/AI_TOOL (context-dependent)
- If uncertain, use NEUTRAL and lower confidence
- Never assume all of one platform is productive or distracting

Respond with ONLY the JSON object, no other text."""


class GroqClassifier:
    """
    Classifies unknown activities using Groq's fast LLM inference.
    Only sends minimal sanitized data (application, domain, title).
    """

    def __init__(self):
        self._client = None
        self._enabled = False
        self._last_request_time = 0.0
        self._min_request_interval = 2.0  # Rate limit: max 1 req per 2 seconds
        self._request_count = 0
        self._error_count = 0
        self._init_client()

    def _init_client(self):
        """Initialize the Groq client with API key from environment."""
        if not GROQ_AVAILABLE:
            return

        api_key = os.environ.get("GROQ_API_KEY", "")
        if not api_key:
            logger.info("GROQ_API_KEY not set — AI classification disabled")
            return

        try:
            self._client = Groq(api_key=api_key)
            self._enabled = True
            logger.info("Groq classifier initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Groq client: {e}")

    @property
    def is_enabled(self) -> bool:
        return self._enabled and self._client is not None

    def classify(self, payload: dict) -> dict | None:
        """
        Classify an activity using Groq.

        Args:
            payload: Sanitized payload with keys: application, domain, title

        Returns:
            dict with classification, category, confidence or None on failure
        """
        if not self.is_enabled:
            return None

        # Rate limiting
        now = time.time()
        elapsed = now - self._last_request_time
        if elapsed < self._min_request_interval:
            time.sleep(self._min_request_interval - elapsed)

        # Build the user message from the sanitized payload
        parts = []
        if payload.get("application"):
            parts.append(f"Application: {payload['application']}")
        if payload.get("domain"):
            parts.append(f"Website: {payload['domain']}")
        if payload.get("title"):
            parts.append(f"Page title: {payload['title']}")

        user_message = "\n".join(parts) if parts else "Unknown activity"

        try:
            self._last_request_time = time.time()
            self._request_count += 1

            response = self._client.chat.completions.create(
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_message},
                ],
                model="llama-3.1-8b-instant",
                temperature=0,
                max_tokens=80,
            )

            content = response.choices[0].message.content.strip()

            # Parse JSON response
            # Handle potential markdown code blocks
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
                content = content.strip()

            result = json.loads(content)

            # Validate response structure
            classification = result.get("classification", "NEUTRAL")
            category = result.get("category", "UNKNOWN")
            confidence = float(result.get("confidence", 0.5))

            # Ensure valid values
            valid_classifications = {"PRODUCTIVE", "NEUTRAL", "DISTRACTION"}
            if classification not in valid_classifications:
                classification = "NEUTRAL"
                confidence = min(confidence, 0.5)

            confidence = max(0.0, min(1.0, confidence))

            logger.debug(
                f"Groq classified: {payload} → "
                f"{classification}/{category} ({confidence:.2f})"
            )

            return {
                "classification": classification,
                "category": category,
                "confidence": confidence,
                "source": "groq",
            }

        except json.JSONDecodeError as e:
            logger.warning(f"Groq returned invalid JSON: {e}")
            self._error_count += 1
            return None

        except Exception as e:
            logger.warning(f"Groq classification failed: {e}")
            self._error_count += 1
            return None

    def get_stats(self) -> dict:
        return {
            "enabled": self.is_enabled,
            "requests": self._request_count,
            "errors": self._error_count,
        }
