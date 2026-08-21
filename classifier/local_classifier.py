"""
FocusORM — Local Classifier
Multi-signal classifier that combines local rules, user overrides,
cached AI results, and optional Groq to classify activities.

Priority chain (spec §93-94):
1. Privacy rule → skip detailed tracking
2. User override → always wins
3. Known local rule
4. Cached AI classification
5. Groq (if enabled)
6. UNKNOWN
"""

import logging
from classifier.rules import (
    ClassificationResult,
    classify_application,
    classify_domain,
)
from classifier.cache import ClassificationCache
from classifier.sanitizer import (
    sanitize_window_title,
    sanitize_page_title,
    create_groq_payload,
    extract_domain,
    is_private_app,
)
from classifier.groq_classifier import GroqClassifier

logger = logging.getLogger("FocusORM.classifier")


class LocalClassifier:
    """
    The main classification engine.
    Follows the priority chain and uses multiple signals.
    """

    def __init__(self, groq_enabled: bool = False):
        self.cache = ClassificationCache()
        self.groq = GroqClassifier() if groq_enabled else None
        self._groq_enabled = groq_enabled

    def classify(
        self,
        app_name: str,
        window_title: str = "",
        domain: str = "",
        page_title: str = "",
        url: str = "",
    ) -> ClassificationResult:
        """
        Classify an activity using the full priority chain.

        Args:
            app_name: Normalized application name
            window_title: Raw window title (will be sanitized)
            domain: Website domain (if browser)
            page_title: Browser page title (if browser)
            url: Full URL (used only for domain extraction, then discarded)

        Returns:
            ClassificationResult with classification, category, confidence, source
        """
        # Extract domain from URL if not provided
        if url and not domain:
            domain = extract_domain(url)

        # ─── STEP 1: Privacy rules ───────────────────────
        # Check if app or domain is marked private
        if is_private_app(app_name):
            return ClassificationResult(
                classification="NEUTRAL",
                category="PRIVATE",
                confidence=1.0,
                source="privacy_rule",
            )

        if domain and self.cache.is_private("domain", domain):
            return ClassificationResult(
                classification="NEUTRAL",
                category="PRIVATE",
                confidence=1.0,
                source="privacy_rule",
            )

        if app_name and self.cache.is_private("application", app_name):
            return ClassificationResult(
                classification="NEUTRAL",
                category="PRIVATE",
                confidence=1.0,
                source="privacy_rule",
            )

        # ─── STEP 2: User overrides ──────────────────────
        if domain:
            user_rule = self.cache.get_user_rule("domain", domain)
            if user_rule:
                return ClassificationResult(
                    classification=user_rule["classification"],
                    category=user_rule["category"],
                    confidence=1.0,
                    source="user_rule",
                )

        if app_name:
            user_rule = self.cache.get_user_rule("application", app_name)
            if user_rule:
                return ClassificationResult(
                    classification=user_rule["classification"],
                    category=user_rule["category"],
                    confidence=1.0,
                    source="user_rule",
                )

        # ─── STEP 3: Known local rules ───────────────────
        # For browsers, try domain first (more specific)
        if domain:
            domain_result = classify_domain(domain)
            if domain_result:
                return domain_result

        # Try application rules
        if app_name:
            app_result = classify_application(app_name)
            if app_result:
                return app_result

        # ─── STEP 4: Cached AI classification ─────────────
        cache_key = domain if domain else app_name
        if cache_key:
            cached = self.cache.get("groq", cache_key)
            if cached:
                return ClassificationResult(
                    classification=cached["classification"],
                    category=cached["category"],
                    confidence=cached["confidence"],
                    source="groq_cached",
                )

        # ─── STEP 5: Groq classification ─────────────────
        if self._groq_enabled and self.groq and self.groq.is_enabled:
            # Sanitize before sending
            safe_title = sanitize_page_title(page_title) if page_title else ""
            payload = create_groq_payload(
                application=app_name,
                domain=domain,
                page_title=safe_title,
            )

            result = self.groq.classify(payload)

            if result:
                # Cache the result
                self.cache.put(
                    source="groq",
                    identifier=cache_key or app_name,
                    classification=result["classification"],
                    category=result["category"],
                    confidence=result["confidence"],
                )

                # Log for transparency
                self.cache.log_ai_request(
                    reason=f"Unknown {'domain' if domain else 'application'}",
                    payload_summary=str(payload),
                    classification=result["classification"],
                    category=result["category"],
                    confidence=result["confidence"],
                    success=True,
                )

                return ClassificationResult(
                    classification=result["classification"],
                    category=result["category"],
                    confidence=result["confidence"],
                    source="groq",
                )
            else:
                # Log failed request
                self.cache.log_ai_request(
                    reason=f"Unknown {'domain' if domain else 'application'}",
                    payload_summary=str(payload),
                    classification="UNKNOWN",
                    category="UNKNOWN",
                    confidence=0.0,
                    success=False,
                )

        # ─── STEP 6: Unknown ─────────────────────────────
        return ClassificationResult(
            classification="UNKNOWN",
            category="UNKNOWN",
            confidence=0.0,
            source="none",
        )

    def set_user_override(
        self, rule_type: str, identifier: str,
        classification: str, category: str,
    ):
        """Allow user to override a classification (spec §37-38)."""
        self.cache.set_user_rule(rule_type, identifier, classification, category)

    def get_user_rules(self) -> list[dict]:
        """Get all user-defined rules."""
        return self.cache.get_all_user_rules()

    def get_ai_log(self, limit: int = 50) -> list[dict]:
        """Get AI request transparency log."""
        return self.cache.get_ai_request_log(limit)

    def reload_groq(self, api_key: str | None = None):
        """
        Hot-reload the Groq classifier with a new or cleared API key.
        Called by the AI settings route after the user saves/removes a key.
        api_key=None → disables Groq.
        """
        if self.groq is None:
            if api_key:
                # Groq was previously disabled; create classifier now
                from classifier.groq_classifier import GroqClassifier
                self.groq = GroqClassifier()
                self.groq.reload(api_key)
                self._groq_enabled = True
        else:
            self.groq.reload(api_key)
            self._groq_enabled = bool(api_key)
