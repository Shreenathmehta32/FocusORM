"""
FocusORM — Local Classification Rules
Known application and website classifications.
No AI needed for these — they are deterministic local rules.
"""


class ClassificationResult:
    """Result of classifying an activity."""

    __slots__ = ("classification", "category", "confidence", "source")

    def __init__(
        self,
        classification: str = "UNKNOWN",
        category: str = "UNKNOWN",
        confidence: float = 0.0,
        source: str = "unknown",
    ):
        self.classification = classification
        self.category = category
        self.confidence = confidence
        self.source = source

    def to_dict(self) -> dict:
        return {
            "classification": self.classification,
            "category": self.category,
            "confidence": self.confidence,
            "source": self.source,
        }


# ─── APPLICATION RULES ────────────────────────────────────
# Maps normalized app names to (classification, category)
APP_RULES: dict[str, tuple[str, str]] = {
    # Code Editors & IDEs → Coding / Productive
    "Visual Studio Code": ("PRODUCTIVE", "CODING"),
    "VS Code Insiders": ("PRODUCTIVE", "CODING"),
    "Visual Studio": ("PRODUCTIVE", "CODING"),
    "IntelliJ IDEA": ("PRODUCTIVE", "CODING"),
    "PyCharm": ("PRODUCTIVE", "CODING"),
    "WebStorm": ("PRODUCTIVE", "CODING"),
    "CLion": ("PRODUCTIVE", "CODING"),
    "GoLand": ("PRODUCTIVE", "CODING"),
    "Rider": ("PRODUCTIVE", "CODING"),
    "Android Studio": ("PRODUCTIVE", "CODING"),
    "Sublime Text": ("PRODUCTIVE", "CODING"),
    "Atom": ("PRODUCTIVE", "CODING"),
    "Notepad++": ("PRODUCTIVE", "CODING"),

    # Terminals → Productive / Development
    "Windows Terminal": ("PRODUCTIVE", "DEVELOPMENT"),
    "Command Prompt": ("PRODUCTIVE", "DEVELOPMENT"),
    "PowerShell": ("PRODUCTIVE", "DEVELOPMENT"),
    "Git Bash": ("PRODUCTIVE", "DEVELOPMENT"),
    "Alacritty": ("PRODUCTIVE", "DEVELOPMENT"),
    "Hyper": ("PRODUCTIVE", "DEVELOPMENT"),
    "WezTerm": ("PRODUCTIVE", "DEVELOPMENT"),

    # Office — Productive / Writing
    "Microsoft Word": ("PRODUCTIVE", "WRITING"),
    "Microsoft Excel": ("PRODUCTIVE", "PROJECT_WORK"),
    "Microsoft PowerPoint": ("PRODUCTIVE", "PROJECT_WORK"),
    "OneNote": ("PRODUCTIVE", "WRITING"),

    # Communication — Neutral (context-dependent)
    "Outlook": ("NEUTRAL", "COMMUNICATION"),
    "Microsoft Teams": ("NEUTRAL", "COMMUNICATION"),
    "Discord": ("NEUTRAL", "COMMUNICATION"),
    "Slack": ("NEUTRAL", "COMMUNICATION"),
    "Telegram": ("NEUTRAL", "COMMUNICATION"),
    "WhatsApp": ("NEUTRAL", "COMMUNICATION"),
    "Zoom": ("NEUTRAL", "COMMUNICATION"),
    "Skype": ("NEUTRAL", "COMMUNICATION"),

    # Media — Entertainment (but could be productive)
    "Spotify": ("NEUTRAL", "MEDIA"),
    "VLC": ("NEUTRAL", "MEDIA"),
    "Windows Media Player": ("NEUTRAL", "MEDIA"),

    # Design — Productive
    "Figma": ("PRODUCTIVE", "DESIGN"),
    "Photoshop": ("PRODUCTIVE", "DESIGN"),
    "Illustrator": ("PRODUCTIVE", "DESIGN"),

    # Database & API Tools — Productive
    "Postman": ("PRODUCTIVE", "DEVELOPMENT"),
    "DBeaver": ("PRODUCTIVE", "DEVELOPMENT"),
    "DataGrip": ("PRODUCTIVE", "DEVELOPMENT"),

    # PDF/Reading — Productive
    "Adobe Acrobat": ("PRODUCTIVE", "READING"),
    "Adobe Reader": ("PRODUCTIVE", "READING"),
    "Foxit Reader": ("PRODUCTIVE", "READING"),
    "SumatraPDF": ("PRODUCTIVE", "READING"),

    # Notes — Productive
    "Obsidian": ("PRODUCTIVE", "WRITING"),
    "Notion": ("PRODUCTIVE", "WRITING"),
    "Typora": ("PRODUCTIVE", "WRITING"),

    # System — Neutral
    "File Explorer": ("NEUTRAL", "SYSTEM"),
    "Task Manager": ("NEUTRAL", "SYSTEM"),
    "Windows Settings": ("NEUTRAL", "SYSTEM"),
    "Notepad": ("NEUTRAL", "SYSTEM"),

    # Games — Distraction
    "Steam": ("DISTRACTION", "GAMING"),
    "Epic Games": ("DISTRACTION", "GAMING"),
}

# ─── WEBSITE / DOMAIN RULES ──────────────────────────────
# Maps domain (lowercase) to (classification, category)
DOMAIN_RULES: dict[str, tuple[str, str]] = {
    # Coding & Development — Productive
    "github.com": ("PRODUCTIVE", "CODING"),
    "gitlab.com": ("PRODUCTIVE", "CODING"),
    "bitbucket.org": ("PRODUCTIVE", "CODING"),
    "stackoverflow.com": ("PRODUCTIVE", "RESEARCH"),
    "stackexchange.com": ("PRODUCTIVE", "RESEARCH"),
    "dev.to": ("PRODUCTIVE", "LEARNING"),
    "medium.com": ("NEUTRAL", "READING"),
    "hashnode.dev": ("PRODUCTIVE", "LEARNING"),
    "replit.com": ("PRODUCTIVE", "CODING"),
    "codepen.io": ("PRODUCTIVE", "CODING"),
    "codesandbox.io": ("PRODUCTIVE", "CODING"),
    "jsfiddle.net": ("PRODUCTIVE", "CODING"),
    "npmjs.com": ("PRODUCTIVE", "DEVELOPMENT"),
    "pypi.org": ("PRODUCTIVE", "DEVELOPMENT"),
    "crates.io": ("PRODUCTIVE", "DEVELOPMENT"),
    "hub.docker.com": ("PRODUCTIVE", "DEVELOPMENT"),
    "vercel.com": ("PRODUCTIVE", "DEVELOPMENT"),
    "netlify.com": ("PRODUCTIVE", "DEVELOPMENT"),
    "render.com": ("PRODUCTIVE", "DEVELOPMENT"),
    "railway.app": ("PRODUCTIVE", "DEVELOPMENT"),
    "supabase.com": ("PRODUCTIVE", "DEVELOPMENT"),
    "firebase.google.com": ("PRODUCTIVE", "DEVELOPMENT"),

    # Documentation — Productive
    "docs.python.org": ("PRODUCTIVE", "LEARNING"),
    "developer.mozilla.org": ("PRODUCTIVE", "LEARNING"),
    "react.dev": ("PRODUCTIVE", "LEARNING"),
    "vuejs.org": ("PRODUCTIVE", "LEARNING"),
    "angular.io": ("PRODUCTIVE", "LEARNING"),
    "nextjs.org": ("PRODUCTIVE", "LEARNING"),
    "tailwindcss.com": ("PRODUCTIVE", "LEARNING"),
    "docs.microsoft.com": ("PRODUCTIVE", "LEARNING"),
    "learn.microsoft.com": ("PRODUCTIVE", "LEARNING"),
    "w3schools.com": ("PRODUCTIVE", "LEARNING"),
    "devdocs.io": ("PRODUCTIVE", "LEARNING"),
    "readthedocs.io": ("PRODUCTIVE", "LEARNING"),

    # Learning & Courses — Productive
    "leetcode.com": ("PRODUCTIVE", "CODING"),
    "hackerrank.com": ("PRODUCTIVE", "CODING"),
    "codeforces.com": ("PRODUCTIVE", "CODING"),
    "codechef.com": ("PRODUCTIVE", "CODING"),
    "geeksforgeeks.org": ("PRODUCTIVE", "LEARNING"),
    "coursera.org": ("PRODUCTIVE", "LEARNING"),
    "udemy.com": ("PRODUCTIVE", "LEARNING"),
    "edx.org": ("PRODUCTIVE", "LEARNING"),
    "khanacademy.org": ("PRODUCTIVE", "LEARNING"),
    "freecodecamp.org": ("PRODUCTIVE", "LEARNING"),
    "codecademy.com": ("PRODUCTIVE", "LEARNING"),
    "pluralsight.com": ("PRODUCTIVE", "LEARNING"),
    "skillshare.com": ("PRODUCTIVE", "LEARNING"),
    "brilliant.org": ("PRODUCTIVE", "LEARNING"),

    # Productivity Tools — Productive
    "docs.google.com": ("PRODUCTIVE", "WRITING"),
    "sheets.google.com": ("PRODUCTIVE", "PROJECT_WORK"),
    "slides.google.com": ("PRODUCTIVE", "PROJECT_WORK"),
    "drive.google.com": ("PRODUCTIVE", "PROJECT_WORK"),
    "notion.so": ("PRODUCTIVE", "WRITING"),
    "trello.com": ("PRODUCTIVE", "PROJECT_WORK"),
    "asana.com": ("PRODUCTIVE", "PROJECT_WORK"),
    "linear.app": ("PRODUCTIVE", "PROJECT_WORK"),
    "jira.atlassian.com": ("PRODUCTIVE", "PROJECT_WORK"),
    "figma.com": ("PRODUCTIVE", "DESIGN"),
    "canva.com": ("PRODUCTIVE", "DESIGN"),
    "miro.com": ("PRODUCTIVE", "PROJECT_WORK"),
    "overleaf.com": ("PRODUCTIVE", "WRITING"),

    # Research — Productive
    "scholar.google.com": ("PRODUCTIVE", "RESEARCH"),
    "arxiv.org": ("PRODUCTIVE", "RESEARCH"),
    "researchgate.net": ("PRODUCTIVE", "RESEARCH"),
    "wikipedia.org": ("PRODUCTIVE", "RESEARCH"),
    "en.wikipedia.org": ("PRODUCTIVE", "RESEARCH"),

    # AI Tools — Neutral (context-dependent per §84)
    "chat.openai.com": ("NEUTRAL", "AI_TOOL"),
    "chatgpt.com": ("NEUTRAL", "AI_TOOL"),
    "claude.ai": ("NEUTRAL", "AI_TOOL"),
    "gemini.google.com": ("NEUTRAL", "AI_TOOL"),
    "bard.google.com": ("NEUTRAL", "AI_TOOL"),
    "perplexity.ai": ("NEUTRAL", "AI_TOOL"),
    "copilot.microsoft.com": ("NEUTRAL", "AI_TOOL"),

    # Search — Neutral
    "google.com": ("NEUTRAL", "SEARCH"),
    "bing.com": ("NEUTRAL", "SEARCH"),
    "duckduckgo.com": ("NEUTRAL", "SEARCH"),

    # Social Media — Distraction
    "instagram.com": ("DISTRACTION", "SOCIAL_MEDIA"),
    "facebook.com": ("DISTRACTION", "SOCIAL_MEDIA"),
    "twitter.com": ("DISTRACTION", "SOCIAL_MEDIA"),
    "x.com": ("DISTRACTION", "SOCIAL_MEDIA"),
    "tiktok.com": ("DISTRACTION", "SOCIAL_MEDIA"),
    "snapchat.com": ("DISTRACTION", "SOCIAL_MEDIA"),
    "pinterest.com": ("DISTRACTION", "SOCIAL_MEDIA"),
    "threads.net": ("DISTRACTION", "SOCIAL_MEDIA"),

    # Entertainment — Distraction
    "netflix.com": ("DISTRACTION", "ENTERTAINMENT"),
    "primevideo.com": ("DISTRACTION", "ENTERTAINMENT"),
    "hotstar.com": ("DISTRACTION", "ENTERTAINMENT"),
    "disneyplus.com": ("DISTRACTION", "ENTERTAINMENT"),
    "hulu.com": ("DISTRACTION", "ENTERTAINMENT"),
    "twitch.tv": ("DISTRACTION", "ENTERTAINMENT"),
    "9gag.com": ("DISTRACTION", "ENTERTAINMENT"),
    "buzzfeed.com": ("DISTRACTION", "ENTERTAINMENT"),

    # YouTube — Context-dependent (§12); default neutral
    "youtube.com": ("NEUTRAL", "VIDEO"),
    "www.youtube.com": ("NEUTRAL", "VIDEO"),

    # Reddit — Context-dependent; default distraction
    "reddit.com": ("DISTRACTION", "SOCIAL_MEDIA"),
    "www.reddit.com": ("DISTRACTION", "SOCIAL_MEDIA"),

    # LinkedIn — Neutral
    "linkedin.com": ("NEUTRAL", "SOCIAL_MEDIA"),
    "www.linkedin.com": ("NEUTRAL", "SOCIAL_MEDIA"),

    # News — Neutral
    "news.ycombinator.com": ("NEUTRAL", "NEWS"),

    # Shopping — Distraction
    "amazon.com": ("DISTRACTION", "SHOPPING"),
    "amazon.in": ("DISTRACTION", "SHOPPING"),
    "flipkart.com": ("DISTRACTION", "SHOPPING"),
    "ebay.com": ("DISTRACTION", "SHOPPING"),

    # Email — Neutral
    "mail.google.com": ("NEUTRAL", "COMMUNICATION"),
    "outlook.live.com": ("NEUTRAL", "COMMUNICATION"),
    "outlook.office.com": ("NEUTRAL", "COMMUNICATION"),
}


def classify_application(app_name: str) -> ClassificationResult | None:
    """
    Classify an application using local rules.
    Returns None if the application is unknown.
    """
    if not app_name:
        return None

    rule = APP_RULES.get(app_name)
    if rule:
        return ClassificationResult(
            classification=rule[0],
            category=rule[1],
            confidence=1.0,
            source="local_rule",
        )
    return None


def classify_domain(domain: str) -> ClassificationResult | None:
    """
    Classify a website domain using local rules.
    Returns None if the domain is unknown.
    """
    if not domain:
        return None

    domain = domain.lower().strip()

    # Direct match
    rule = DOMAIN_RULES.get(domain)
    if rule:
        return ClassificationResult(
            classification=rule[0],
            category=rule[1],
            confidence=1.0,
            source="local_rule",
        )

    # Try without www.
    if domain.startswith("www."):
        bare = domain[4:]
        rule = DOMAIN_RULES.get(bare)
        if rule:
            return ClassificationResult(
                classification=rule[0],
                category=rule[1],
                confidence=1.0,
                source="local_rule",
            )

    # Try parent domain (e.g., docs.github.com → github.com)
    parts = domain.split(".")
    if len(parts) > 2:
        parent = ".".join(parts[-2:])
        rule = DOMAIN_RULES.get(parent)
        if rule:
            return ClassificationResult(
                classification=rule[0],
                category=rule[1],
                confidence=0.9,
                source="local_rule",
            )

    return None
