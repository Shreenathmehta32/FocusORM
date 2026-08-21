"""
FocusORM — FastAPI Backend
Local server bound to 127.0.0.1:8745.
Serves the React dashboard and browser extension with activity data.
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import init_db
from backend.routes import status, sessions, applications, websites, analytics, focus, settings, rules, privacy, ai_settings

logger = logging.getLogger("FocusORM.backend")

app = FastAPI(
    title="FocusORM",
    description="Privacy-First AI Student Productivity Intelligence System",
    version="1.0.0",
)

# CORS for local React dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",     # Vite dev
        "http://localhost:4173",     # Vite preview
        "http://127.0.0.1:5173",
        "http://127.0.0.1:4173",
        "chrome-extension://*",      # Browser extension
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(status.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")
app.include_router(applications.router, prefix="/api")
app.include_router(websites.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(focus.router, prefix="/api")
app.include_router(settings.router, prefix="/api")
app.include_router(rules.router, prefix="/api")
app.include_router(privacy.router, prefix="/api")
app.include_router(ai_settings.router, prefix="/api")


@app.on_event("startup")
async def startup():
    init_db()
    from agent.main import get_agent
    agent = get_agent()
    if not agent.is_running:
        agent.start()
        logger.info("FocusORM tracking agent started automatically with backend")
    logger.info("FocusORM backend started on 127.0.0.1:8745")


@app.on_event("shutdown")
async def shutdown():
    from agent.main import get_agent
    agent = get_agent()
    if agent.is_running:
        agent.stop()
        logger.info("FocusORM tracking agent stopped with backend")


@app.get("/")
async def root():
    return {"name": "FocusORM", "version": "1.0.0", "status": "running"}
