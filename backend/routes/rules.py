"""FocusORM — Rules Route"""

from fastapi import APIRouter
from pydantic import BaseModel
from agent.main import get_agent

router = APIRouter(tags=["Rules"])


class RuleCreate(BaseModel):
    rule_type: str  # "domain" or "application"
    identifier: str  # e.g., "reddit.com" or "Discord"
    classification: str  # PRODUCTIVE, NEUTRAL, DISTRACTION
    category: str  # CODING, LEARNING, etc.


class ClassificationOverride(BaseModel):
    rule_type: str
    identifier: str
    classification: str
    category: str


@router.get("/rules")
async def get_rules():
    """Get all user-defined classification rules."""
    agent = get_agent()
    return agent.classifier.get_user_rules()


@router.post("/rules")
async def create_rule(rule: RuleCreate):
    """Create or update a user classification rule."""
    agent = get_agent()
    agent.classifier.set_user_override(
        rule.rule_type, rule.identifier, rule.classification, rule.category
    )
    return {"status": "created", "rule": rule.model_dump()}


@router.post("/classification/override")
async def override_classification(override: ClassificationOverride):
    """Override a classification (user correction)."""
    agent = get_agent()
    agent.classifier.set_user_override(
        override.rule_type, override.identifier,
        override.classification, override.category,
    )
    return {"status": "overridden", "override": override.model_dump()}


@router.post("/browser/event")
async def browser_event(event: dict):
    """
    Receive browser tab events from the extension.
    Expected: {domain, title, url, timestamp}
    """
    agent = get_agent()
    agent.update_browser_info(event)
    return {"status": "received"}
