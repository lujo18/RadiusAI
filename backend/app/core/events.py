"""
Application lifespan events (startup/shutdown)
Manages background workers (analytics, automation, payment reconciliation)
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from apscheduler.schedulers.asyncio import AsyncIOScheduler

logger = logging.getLogger(__name__)

# Global scheduler instance (initialized at startup)
_scheduler = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application lifespan:
    - Startup: Initialize background workers, payment processor, scheduled tasks
    - Shutdown: Clean up resources

    Usage:
        app = FastAPI(lifespan=lifespan)
    """

    # Ensure the scheduler name is treated as a module-level global
    global _scheduler

    # ═══════ STARTUP ═══════
    try:
        logger.info("🚀 Starting SlideForge backend...")

        # ─ Initialize scheduled tasks (APScheduler) ─
        from app.core.config import settings

        if settings.USE_POLAR:
            # from app.worker.polar_tasks import add_polar_jobs_to_scheduler

            # _scheduler = AsyncIOScheduler()
            # # add_polar_jobs_to_scheduler(_scheduler)
            # _scheduler.start()
            logger.info("✓ Polar scheduled tasks (skipped)")

        # TODO: Initialize background workers here
        # from app.features.analytics.workers import start_analytics_worker
        # from app.features.automation.workers import start_automation_worker
        # worker1 = start_analytics_worker()
        # worker2 = start_automation_worker()

        logger.info("✅ Backend startup complete")

    except Exception as e:
        logger.error(f"❌ Startup failed: {e}", exc_info=True)
        raise








    yield  # ← App runs here

    # ═══════ SHUTDOWN ═══════
    try:
        logger.info("🛑 Shutting down SlideForge backend...")

        # ─ Stop scheduled tasks ─
        if _scheduler and _scheduler.running:
            _scheduler.shutdown()
            logger.info("✓ Scheduled tasks stopped")

        # TODO: Stop background workers
        # await worker1.stop()
        # await worker2.stop()

        logger.info("✅ Shutdown complete")

    except Exception as e:
        logger.error(f"❌ Shutdown error: {e}", exc_info=True)
