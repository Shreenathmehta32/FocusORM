"""
FocusORM — Classification Cache
Caches AI classifications locally to minimize Groq API usage.
Once a domain/app is classified, it's stored locally and reused.
"""

import sqlite3
import time
import logging
from agent.config import DB_PATH

logger = logging.getLogger("FocusORM.cache")


class ClassificationCache:
    """
    Local cache for AI classifications.
    Prevents redundant Groq API calls for already-classified activities.
    """

    def __init__(self):
        self._init_table()
        self._memory_cache: dict[str, dict] = {}

    def _init_table(self):
        """Create the classifications table if it doesn't exist."""
        try:
            conn = sqlite3.connect(str(DB_PATH))
            conn.execute("""
                CREATE TABLE IF NOT EXISTS classifications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    source TEXT NOT NULL,
                    identifier TEXT NOT NULL,
                    classification TEXT NOT NULL,
                    category TEXT NOT NULL,
                    confidence REAL DEFAULT 0.0,
                    user_override INTEGER DEFAULT 0,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(source, identifier)
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS user_rules (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    rule_type TEXT NOT NULL,
                    identifier TEXT NOT NULL,
                    classification TEXT NOT NULL,
                    category TEXT NOT NULL,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(rule_type, identifier)
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS privacy_rules (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    rule_type TEXT NOT NULL,
                    identifier TEXT NOT NULL,
                    action TEXT NOT NULL DEFAULT 'private',
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(rule_type, identifier)
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS ai_requests (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
                    reason TEXT,
                    payload_summary TEXT,
                    classification TEXT,
                    category TEXT,
                    confidence REAL,
                    success INTEGER DEFAULT 1
                )
            """)
            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"Failed to create cache tables: {e}")

    def get(self, source: str, identifier: str) -> dict | None:
        """
        Look up a cached classification.
        Checks memory cache first, then SQLite.
        """
        cache_key = f"{source}:{identifier}"

        # Memory cache (fastest)
        if cache_key in self._memory_cache:
            return self._memory_cache[cache_key]

        # SQLite cache
        try:
            conn = sqlite3.connect(str(DB_PATH))
            cursor = conn.execute(
                """
                SELECT classification, category, confidence, source
                FROM classifications
                WHERE source = ? AND identifier = ?
                """,
                (source, identifier),
            )
            row = cursor.fetchone()
            conn.close()

            if row:
                result = {
                    "classification": row[0],
                    "category": row[1],
                    "confidence": row[2],
                    "source": row[3] + "_cached",
                }
                self._memory_cache[cache_key] = result
                return result

        except Exception as e:
            logger.error(f"Cache lookup failed: {e}")

        return None

    def put(self, source: str, identifier: str, classification: str,
            category: str, confidence: float):
        """Store a classification in both memory and SQLite cache."""
        cache_key = f"{source}:{identifier}"

        result = {
            "classification": classification,
            "category": category,
            "confidence": confidence,
            "source": source,
        }
        self._memory_cache[cache_key] = result

        try:
            conn = sqlite3.connect(str(DB_PATH))
            conn.execute(
                """
                INSERT OR REPLACE INTO classifications
                (source, identifier, classification, category, confidence, updated_at)
                VALUES (?, ?, ?, ?, ?, datetime('now'))
                """,
                (source, identifier, classification, category, confidence),
            )
            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"Cache write failed: {e}")

    def get_user_rule(self, rule_type: str, identifier: str) -> dict | None:
        """Look up a user-defined classification rule."""
        try:
            conn = sqlite3.connect(str(DB_PATH))
            cursor = conn.execute(
                """
                SELECT classification, category
                FROM user_rules
                WHERE rule_type = ? AND identifier = ?
                """,
                (rule_type, identifier),
            )
            row = cursor.fetchone()
            conn.close()

            if row:
                return {
                    "classification": row[0],
                    "category": row[1],
                    "confidence": 1.0,
                    "source": "user_rule",
                }
        except Exception as e:
            logger.error(f"User rule lookup failed: {e}")

        return None

    def set_user_rule(self, rule_type: str, identifier: str,
                      classification: str, category: str):
        """Create or update a user classification rule."""
        try:
            conn = sqlite3.connect(str(DB_PATH))
            conn.execute(
                """
                INSERT OR REPLACE INTO user_rules
                (rule_type, identifier, classification, category)
                VALUES (?, ?, ?, ?)
                """,
                (rule_type, identifier, classification, category),
            )
            conn.commit()
            conn.close()
            logger.info(
                f"User rule set: {rule_type}:{identifier} → {classification}/{category}"
            )
        except Exception as e:
            logger.error(f"Failed to set user rule: {e}")

    def is_private(self, rule_type: str, identifier: str) -> bool:
        """Check if an app/domain is marked as private by the user."""
        try:
            conn = sqlite3.connect(str(DB_PATH))
            cursor = conn.execute(
                """
                SELECT 1 FROM privacy_rules
                WHERE rule_type = ? AND identifier = ?
                """,
                (rule_type, identifier),
            )
            result = cursor.fetchone() is not None
            conn.close()
            return result
        except Exception as e:
            logger.error(f"Privacy rule check failed: {e}")
            return False

    def log_ai_request(self, reason: str, payload_summary: str,
                       classification: str, category: str,
                       confidence: float, success: bool):
        """Log a Groq API request for transparency (spec §98, §59)."""
        try:
            conn = sqlite3.connect(str(DB_PATH))
            conn.execute(
                """
                INSERT INTO ai_requests
                (reason, payload_summary, classification, category, confidence, success)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (reason, payload_summary, classification, category,
                 confidence, 1 if success else 0),
            )
            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"Failed to log AI request: {e}")

    def get_all_user_rules(self) -> list[dict]:
        """Get all user-defined rules."""
        try:
            conn = sqlite3.connect(str(DB_PATH))
            cursor = conn.execute(
                "SELECT rule_type, identifier, classification, category FROM user_rules"
            )
            rules = [
                {
                    "rule_type": row[0],
                    "identifier": row[1],
                    "classification": row[2],
                    "category": row[3],
                }
                for row in cursor.fetchall()
            ]
            conn.close()
            return rules
        except Exception as e:
            logger.error(f"Failed to get user rules: {e}")
            return []

    def get_ai_request_log(self, limit: int = 50) -> list[dict]:
        """Get recent AI request log for transparency."""
        try:
            conn = sqlite3.connect(str(DB_PATH))
            cursor = conn.execute(
                """
                SELECT timestamp, reason, payload_summary,
                       classification, category, confidence, success
                FROM ai_requests
                ORDER BY id DESC LIMIT ?
                """,
                (limit,),
            )
            log = [
                {
                    "timestamp": row[0],
                    "reason": row[1],
                    "payload_summary": row[2],
                    "classification": row[3],
                    "category": row[4],
                    "confidence": row[5],
                    "success": bool(row[6]),
                }
                for row in cursor.fetchall()
            ]
            conn.close()
            return log
        except Exception as e:
            logger.error(f"Failed to get AI log: {e}")
            return []
