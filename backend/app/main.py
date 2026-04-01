"""
SlideForge FastAPI Application Entry Point

Architecture:
- Core infrastructure: database, auth, exceptions, events
- Feature modules: each in app/features/<name>/
- Legacy routers: gradually migrated into features
"""

import sys
import logging
from pathlib import Path

# Add backend directory to Python path for absolute imports
backend_dir = Path(__file__).parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.core.exceptions import register_exception_handlers
from app.core.events import lifespan
from app.core.config import settings
from app.api.router import api_router
from app.shared.dependencies import get_current_user

logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    """Create and configure FastAPI application"""

    app = FastAPI(
        title="SlideForge API",
        version="2.0.0",
        description="AI-powered carousel content automation for social media",
        lifespan=lifespan,
    )

    # ═════════ Middleware ═════════
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            settings.FRONTEND_URL,
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ═════════ Logging ═════════
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    # ═════════ Exception Handlers ═════════
    register_exception_handlers(app)

    # ═════════ Routes ═════════

    # Feature-based API router (all endpoints in app/features/)
    # Legacy routers have been fully migrated into feature modules
    app.include_router(api_router)

    # Polar payment processor admin endpoints (feature-flagged)
    if settings.USE_POLAR:
        from app.features.billing.admin_router import (
            router as polar_admin_router,
        )

        app.include_router(polar_admin_router, prefix="/api")
        logger.info("✓ Polar admin endpoints registered")

    # ═════════ Health Check Routes ═════════

    @app.get("/", tags=["health"])
    def root():
        """Health check - public endpoint"""
        return {
            "service": "SlideForge API",
            "version": "2.0.0",
            "status": "running",
            "environment": settings.ENV,
        }

    @app.get("/health", tags=["health"])
    def health():
        """Detailed health check - public endpoint"""
        return {
            "status": "ok",
            "database": "connected",
        }

    @app.get("/protected", tags=["auth"])
    async def protected_route(user_id: str = Depends(get_current_user)):
        """Protected route - requires authentication"""
        return {
            "user_id": user_id,
            "message": "Access granted",
        }

    return app


# Create app instance
app = create_app()

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENV == "development",
    )
