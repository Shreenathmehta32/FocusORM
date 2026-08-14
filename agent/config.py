"""
FocusORM Agent Configuration
Constants, application normalization, and settings.
"""

import os
import json
from pathlib import Path

# ─── Paths ───────────────────────────────────────────────
FOCUSOS_DIR = Path.home() / ".FocusORM"
FOCUSOS_DIR.mkdir(exist_ok=True)

DB_PATH = FOCUSOS_DIR / "FocusORM.db"
CONFIG_DIR = Path(__file__).resolve().parent.parent / "config"
SETTINGS_PATH = CONFIG_DIR / "settings.json"
ENV_PATH = Path(__file__).resolve().parent.parent / ".env"

# ─── Polling & Aggregation ───────────────────────────────
POLL_INTERVAL_SECONDS = 5          # How often to check active window
AGGREGATION_INTERVAL_SECONDS = 30  # How often to flush interaction metrics
IDLE_THRESHOLD_SECONDS = 300       # 5 minutes of no input = idle
MIN_SESSION_DURATION_SECONDS = 2   # Ignore sessions shorter than this

# ─── Backend ─────────────────────────────────────────────
BACKEND_HOST = "127.0.0.1"
BACKEND_PORT = 8745
BACKEND_URL = f"http://{BACKEND_HOST}:{BACKEND_PORT}"

# ─── Browser Processes ───────────────────────────────────
BROWSER_PROCESSES = {
    "chrome.exe", "msedge.exe", "firefox.exe", "brave.exe",
    "opera.exe", "vivaldi.exe", "arc.exe",
}

# ─── Application Name Normalization ──────────────────────
# Maps process names (lowercase) to human-readable names
APP_NAME_MAP = {
    # Code Editors & IDEs
    "code.exe": "Visual Studio Code",
    "code - insiders.exe": "VS Code Insiders",
    "devenv.exe": "Visual Studio",
    "idea64.exe": "IntelliJ IDEA",
    "pycharm64.exe": "PyCharm",
    "webstorm64.exe": "WebStorm",
    "clion64.exe": "CLion",
    "goland64.exe": "GoLand",
    "rider64.exe": "Rider",
    "studio64.exe": "Android Studio",
    "sublime_text.exe": "Sublime Text",
    "atom.exe": "Atom",
    "notepad++.exe": "Notepad++",
    "notepad.exe": "Notepad",
    "wordpad.exe": "WordPad",

    # Browsers
    "chrome.exe": "Google Chrome",
    "msedge.exe": "Microsoft Edge",
    "firefox.exe": "Firefox",
    "brave.exe": "Brave",
    "opera.exe": "Opera",
    "vivaldi.exe": "Vivaldi",

    # Terminals
    "windowsterminal.exe": "Windows Terminal",
    "wt.exe": "Windows Terminal",
    "cmd.exe": "Command Prompt",
    "powershell.exe": "PowerShell",
    "pwsh.exe": "PowerShell",
    "git-bash.exe": "Git Bash",
    "mintty.exe": "Git Bash",
    "conhost.exe": "Console Host",
    "alacritty.exe": "Alacritty",
    "hyper.exe": "Hyper",
    "wezterm-gui.exe": "WezTerm",

    # Office & Productivity
    "winword.exe": "Microsoft Word",
    "excel.exe": "Microsoft Excel",
    "powerpnt.exe": "Microsoft PowerPoint",
    "onenote.exe": "OneNote",
    "outlook.exe": "Outlook",
    "teams.exe": "Microsoft Teams",
    "ms-teams.exe": "Microsoft Teams",

    # Communication
    "discord.exe": "Discord",
    "slack.exe": "Slack",
    "telegram.exe": "Telegram",
    "whatsapp.exe": "WhatsApp",
    "zoom.exe": "Zoom",
    "skype.exe": "Skype",

    # Media
    "spotify.exe": "Spotify",
    "vlc.exe": "VLC",
    "wmplayer.exe": "Windows Media Player",

    # Design
    "figma.exe": "Figma",
    "photoshop.exe": "Photoshop",
    "illustrator.exe": "Illustrator",

    # File & System
    "explorer.exe": "File Explorer",
    "taskmgr.exe": "Task Manager",
    "systemsettings.exe": "Windows Settings",
    "mmc.exe": "Management Console",

    # PDF & Reading
    "acrobat.exe": "Adobe Acrobat",
    "acrord32.exe": "Adobe Reader",
    "foxitreader.exe": "Foxit Reader",
    "sumatrapdf.exe": "SumatraPDF",

    # Database & API
    "postman.exe": "Postman",
    "dbeaver.exe": "DBeaver",
    "datagrip64.exe": "DataGrip",
    "mongosh.exe": "MongoDB Shell",

    # Games (common)
    "steam.exe": "Steam",
    "epicgameslauncher.exe": "Epic Games",

    # Misc
    "obsidian.exe": "Obsidian",
    "notion.exe": "Notion",
    "typora.exe": "Typora",
}


def normalize_app_name(process_name: str) -> str:
    """Convert a process filename to a human-readable application name."""
    if not process_name:
        return "Unknown"
    key = process_name.lower().strip()
    if key in APP_NAME_MAP:
        return APP_NAME_MAP[key]
    # Fallback: remove .exe and title-case
    name = key.replace(".exe", "").replace("_", " ").replace("-", " ")
    return name.title()


def is_browser(process_name: str) -> bool:
    """Check if the process is a known browser."""
    if not process_name:
        return False
    return process_name.lower().strip() in BROWSER_PROCESSES


def load_settings() -> dict:
    """Load settings from config/settings.json, with defaults."""
    defaults = {
        "tracking_enabled": True,
        "track_applications": True,
        "track_websites": True,
        "track_interaction_metrics": True,
        "track_coding_metrics": True,
        "enable_groq": False,
        "idle_threshold_seconds": IDLE_THRESHOLD_SECONDS,
        "poll_interval_seconds": POLL_INTERVAL_SECONDS,
        "aggregation_interval_seconds": AGGREGATION_INTERVAL_SECONDS,
        "data_retention_days": 90,
        "privacy_mode": "normal",
    }
    try:
        if SETTINGS_PATH.exists():
            with open(SETTINGS_PATH, "r") as f:
                user_settings = json.load(f)
            defaults.update(user_settings)
    except (json.JSONDecodeError, IOError):
        pass
    return defaults
