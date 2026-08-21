# ⚡ FocusORM

> **Privacy-First AI Student Productivity Intelligence System**  
> *Track deeply. Store locally. Analyze locally. Send minimal sanitized data to AI only when necessary.*

---

## 🌟 Overview

FocusORM is a local-first desktop productivity intelligence system designed specifically for students and engineers. Unlike simple screen-time apps, FocusORM understands **actual engagement**, distinguishing between active deep study, passive background windows, coding sessions, reading, and distractions.

### Core Philosophy
1. **Local-First & Private**: Activity tracking, SQLite database, analytics calculation, and idle detection all run on your laptop.
2. **Zero Surveillance**: **NO** keylogging, **NO** continuous screenshots, **NO** clipboard snooping, **NO** webcam/microphone usage, **NO** public IP or username collection.
3. **Multi-Signal Intelligence**: Combines active window title, process ID, aggregate keystroke/mouse activity counts, file modifications, and browser context to gauge productivity accurately.
4. **Smart AI Layer**: Uses Groq LLMs only for unknown activity classification using minimal sanitized payloads (app name, domain, safe title).

---

## 🏗️ Architecture

```
                                USER'S LAPTOP (Local)
┌─────────────────────────────────┐           ┌─────────────────────────────────┐
│     Desktop Activity Tracker    │           │    Browser Extension (MV3)      │
│  (pywin32, psutil, watchdog)    │           │     (Chrome / Edge / Brave)     │
└────────────────┬────────────────┘           └────────────────┬────────────────┘
                 │                                             │
                 └──────────────────────┬──────────────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────┐
                         │   Local Activity Engine     │
                         │   (Sessionize & Sanitize)   │
                         └──────────────┬──────────────┘
                                        │
                         ┌──────────────┴──────────────┐
                         ▼                             ▼
              [Known Local Rules]             [Unknown Activities]
              - VS Code -> Coding                      │
              - LeetCode -> Learning                   ▼
              - Reddit -> Distraction          [Privacy Sanitizer]
                         │                             │
                         │                             ▼
                         │                     [Groq AI (Optional)]
                         │                     - Minimal payload only
                         │                     - Cached locally
                         ▼                             ▼
                         └──────────────┬──────────────┘
                                        ▼
                           ┌─────────────────────────┐
                           │      Local SQLite       │
                           │   (~/.FocusORM/FocusORM.db)│
                           └────────────┬────────────┘
                                        │
                         ┌──────────────┴──────────────┐
                         ▼                             ▼
              [Productivity Engine]          [Inactivity Heuristics]
                         │                             │
                         └──────────────┬──────────────┘
                                        ▼
                           ┌─────────────────────────┐
                           │  FastAPI Local Backend  │
                           │     (127.0.0.1:8745)    │
                           └────────────┬────────────┘
                                        ▼
                           ┌─────────────────────────┐
                           │     React Dashboard     │
                           │  (Vite + Tailwind CSS)  │
                           └─────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Python 3.10+** (Windows 10/11)
- **Node.js 18+**

### 2. Setup & Installation

```bash
# 1. Clone or navigate to the repository
cd FocusORM

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Setup Frontend
cd frontend
npm install
npm run build
cd ..
```

### 3. Configure Groq AI (Optional — no code editing required)

Groq is **optional**. FocusORM works fully without it using local classification rules for 100+ apps and websites.

To enable AI-powered classification:

1. Start FocusORM and open the dashboard.
2. Go to **Settings → AI Provider**.
3. Enter your Groq API key (get one free at [console.groq.com/keys](https://console.groq.com/keys)).
4. Click **Save**, then **Test Connection**.

Your key is stored in `~/.FocusORM/credentials.json` — **on your local machine only**. It is:
- ✅ Never committed to Git
- ✅ Never included in source code
- ✅ Never returned to the frontend in plaintext
- ✅ Only sent to Groq when classifying an activity

> **Legacy fallback**: You can still set `GROQ_API_KEY` in a `.env` file if you prefer. The dashboard method takes priority.

---

## 🖥️ Running FocusORM

### Option A: Run Backend + Agent in one command
```bash
python start.py
```
This initializes the database (`~/.FocusORM/FocusORM.db`), starts the background activity tracker, and serves the FastAPI server at `http://127.0.0.1:8745`.

### Option B: Run Dashboard in Development Mode
In a separate terminal:
```bash
cd frontend
npm run dev
```
Open **`http://localhost:5173`** in your browser to view the live dashboard.

---

## 🧩 Browser Extension Setup (Chrome / Edge / Brave)

1. Open your browser and navigate to:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
2. Enable **Developer Mode** (toggle in top right).
3. Click **Load unpacked** and select the `FocusORM/browser_extension` folder.
4. The FocusORM icon will appear in your browser toolbar, automatically sending sanitized domain & title updates to your local backend.

---

## 📊 Dashboard Features

- **⚡ Live Activity**: Real-time display of foreground application, active domain, session duration, and interaction level.
- **📈 Hourly Productivity**: Recharts stacked bar breakdown of productive, neutral, and distraction minutes across 24 hours.
- **🕒 Daily Timeline**: Visual chronological reconstruction of your entire day.
- **💻 Application & Website Analytics**: Ranked usage durations, active vs idle ratios, and keystroke/click metrics.
- **🎯 Focus Sessions**: Automatically groups uninterrupted productive intervals $\ge 15$ min, tracking deep work and context switches.
- **⚠️ Distraction & Inactivity Analytics**: Non-judgmental detection of fake study, idle windows, and top distraction time sinks.
- **🛡️ Privacy Center**: Complete transparency audit log of local data storage and Groq AI transmissions, with one-click data deletion.

---

## 🔒 Privacy Guarantees

| Category | Policy |
|---|---|
| **Keystrokes** | Only aggregate integer counters (`keyboard_count`). Never logs actual keys. |
| **Screenshots** | Disabled by default. No visual surveillance. |
| **Microphone / Webcam** | Never accessed or requested. |
| **Browsing URLs** | Strips tracking params (`utm_*`, `fbclid`, auth tokens, session IDs). Stores only domain + sanitized title. |
| **Network IP & Identity** | Public IP, student name, and PC username are **never** logged or sent to Groq. |
| **Data Ownership** | 100% stored on user's machine in SQLite (`~/.FocusORM/FocusORM.db`). |

---

## 📜 License

MIT License. Designed for students and builders who value both productivity and privacy.
