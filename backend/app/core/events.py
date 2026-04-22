"""
Application lifespan events (startup/shutdown)
Manages background workers (analytics, automation, payment reconciliation)
"""
from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from apscheduler.schedulers.asyncio import AsyncIOScheduler
logger = logging.getLogger(__name__)


# Global scheduler instance (initialized at startup)
_scheduler = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application lifespan:
    - Startup: Initialize background workers, scheduled tasks
    - Shutdown: Clean up resources
    """

    global _scheduler

    # ═══════ STARTUP ═══════
    try:
        logger.info("🚀 Starting SlideForge backend...")

        # Lazy import settings to avoid import-time cycles
        from app.core.config import settings

        if settings.USE_POLAR:
            logger.info("✓ Polar scheduled tasks (skipped)")

        # Lazily initialize and start APScheduler + worker registration
        try:
            from apscheduler.schedulers.background import BackgroundScheduler
            # Import worker registration lazily to avoid circular imports
            from services.workers.automation.cron import register_automation_worker
            from services.workers.analytics.cron import register_analytics_worker

            _scheduler = BackgroundScheduler()
            register_automation_worker(_scheduler)
            register_analytics_worker(_scheduler)
            _scheduler.start()
            logger.info("✓ Scheduled tasks started")
        except Exception:
            logger.exception("Failed to initialize scheduler; continuing without scheduled jobs")

        logger.info("✅ Backend startup complete")

    except Exception as e:
        logger.error(f"❌ Startup failed: {e}", exc_info=True)
        raise

    yield  # ← App runs here

    # ═══════ SHUTDOWN ═══════
    try:
        logger.info("🛑 Shutting down SlideForge backend...")

        if _scheduler and getattr(_scheduler, "running", False):
            _scheduler.shutdown(wait=False)
            logger.info("✓ Scheduled tasks stopped")

        logger.info("✅ Shutdown complete")

    except Exception as e:
        logger.error(f"❌ Shutdown error: {e}", exc_info=True)
