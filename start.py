"""
FocusORM — Main Entry Point
Starts the tracking agent and the FastAPI backend together.
Usage: python start.py
"""

import sys
import os
import signal
import logging
import threading

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(name)-24s  %(levelname)-7s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("FocusORM")


def main():
    """Start FocusORM: agent + backend."""
    print()
    print("  ╔═══════════════════════════════════════════╗")
    print("  ║               ⚡ FocusORM                  ║")
    print("  ║   Privacy-First Productivity Intelligence ║")
    print("  ╚═══════════════════════════════════════════╝")
    print()

    # Import after path setup
    from agent.main import get_agent
    from agent.config import BACKEND_HOST, BACKEND_PORT

    # Start the tracking agent
    agent = get_agent()
    agent.start()
    logger.info("Tracking agent started")

    # Graceful shutdown handler
    def shutdown(signum=None, frame=None):
        logger.info("Shutting down FocusORM...")
        agent.stop()
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    # Start FastAPI server
    import uvicorn
    from backend.main import app

    logger.info(f"Dashboard: http://{BACKEND_HOST}:{BACKEND_PORT}")
    logger.info(f"API docs:  http://{BACKEND_HOST}:{BACKEND_PORT}/docs")
    print()
    print(f"  🌐 API running at http://{BACKEND_HOST}:{BACKEND_PORT}")
    print(f"  📊 Open http://localhost:5173 for the dashboard")
    print(f"  ⏸  Press Ctrl+C to stop")
    print()

    try:
        uvicorn.run(
            app,
            host=BACKEND_HOST,
            port=BACKEND_PORT,
            log_level="warning",
        )
    except KeyboardInterrupt:
        shutdown()


if __name__ == "__main__":
    main()
