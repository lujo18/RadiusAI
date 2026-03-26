"""
Application lifespan events (startup/shutdown)
Manages background workers (analytics, automation)
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application lifespan:
    - Startup: Initialize background workers
    - Shutdown: Clean up resources
    
    Usage:
        app = FastAPI(lifespan=lifespan)
    """
    
    # ═══════ STARTUP ═══════
    try:
        logger.info("🚀 Starting SlideForge backend...")
        
        # TODO: Initialize background workers here
        # from app.features.analytics.workers import start_analytics_worker
        # from app.features.automation.workers import start_automation_worker
        # worker1 = start_analytics_worker()
        # worker2 = start_automation_worker()
        
        logger.info("✅ Backend startup complete")
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        raise
    
    yield  # ← App runs here
    
    # ═══════ SHUTDOWN ═══════
    try:
        logger.info("🛑 Shutting down SlideForge backend...")
        
        # TODO: Stop background workers
        # await worker1.stop()
        # await worker2.stop()
        
        logger.info("✅ Shutdown complete")
        
    except Exception as e:
        logger.error(f"❌ Shutdown error: {e}")
