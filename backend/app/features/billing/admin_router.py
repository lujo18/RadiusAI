"""Admin endpoints for Polar operations and management.

Requires admin authorization. Provides visibility and manual control over Polar sync,
reconciliation, and health checks.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_admin
from app.features.billing.unified_service import get_unified_billing_service

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/admin/polar",
    tags=["admin", "polar"],
    dependencies=[Depends(require_admin)],
)


@router.get("/status")
async def get_polar_status():
    """Get current Polar integration status and configuration.

    Returns:
    - enabled: bool (USE_POLAR flag)
    - processor: str (active processor: 'polar' or 'stripe')
    - health: dict (health check result)
    """
    from app.core.config import settings

    service = get_unified_billing_service()
    health = await service.verify_payment_processor_health()

    return {
        "enabled": settings.USE_POLAR,
        "processor": "polar" if settings.USE_POLAR else "stripe",
        "health": health,
        "migration_mode": settings.POLAR_MIGRATION_MODE,
        "timestamp": None,  # ISO timestamp
    }


@router.post("/sync-products")
async def trigger_product_sync(db: AsyncSession = Depends(get_db)):
    """Manually trigger product sync from Polar to database.

    Response:
    - synced: bool
    - count: int (products synced)
    - error: str (if failed)
    """
    try:
        logger.info("Admin triggered product sync")
        service = get_unified_billing_service()

        result = await service.polar_service.sync_products()

        if result.get("synced"):
            logger.info(f"Product sync completed: {result.get('count')} products")
            return {"synced": True, "count": result.get("count")}
        else:
            error = result.get("error", "Unknown error")
            logger.error(f"Product sync failed: {error}")
            raise HTTPException(status_code=500, detail=f"Sync failed: {error}")

    except Exception as exc:
        logger.exception("Product sync triggered error")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/reconcile")
async def trigger_reconciliation(db: AsyncSession = Depends(get_db)):
    """Manually trigger benefits reconciliation batch.

    Response:
    - reconciled: bool
    - users_checked: int
    - discrepancies_found: int
    - high_drift_users: list of (user_id, drift_amount)
    - error: str (if failed)
    """
    try:
        logger.info("Admin triggered reconciliation")
        service = get_unified_billing_service()

        result = await service.polar_service.run_daily_reconciliation()

        if result.get("reconciled"):
            logger.info(
                f"Reconciliation completed: "
                f"{result.get('users_checked')} checked, "
                f"{result.get('discrepancies_found')} discrepancies"
            )
            return result
        else:
            error = result.get("error", "Unknown error")
            logger.error(f"Reconciliation failed: {error}")
            raise HTTPException(
                status_code=500, detail=f"Reconciliation failed: {error}"
            )

    except Exception as exc:
        logger.exception("Reconciliation triggered error")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/retry-sync-failures")
async def trigger_retry_sync(db: AsyncSession = Depends(get_db)):
    """Manually trigger retry of failed sync operations.

    Response:
    - retried_count: int
    - succeeded_count: int
    - failed_count: int
    """
    try:
        logger.info("Admin triggered sync retry")

        from app.lib.polar.reconciliation import (
            get_polar_reconciliation_service,
        )

        service = get_polar_reconciliation_service()
        result = await service.sync_local_to_polar_retry()

        logger.info(
            f"Retry batch completed: "
            f"{result.get('succeeded_count')} succeeded, "
            f"{result.get('failed_count')} failed"
        )
        return result

    except Exception as exc:
        logger.exception("Retry triggered error")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/health")
async def check_polar_health():
    """Check current health of Polar API and integrations.

    Response:
    - healthy: bool
    - processor: str
    - errors: list of str
    """
    try:
        service = get_unified_billing_service()
        health = await service.verify_payment_processor_health()

        status_code = 200 if health.get("healthy") else 503
        return health

    except Exception as exc:
        logger.exception("Health check error")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/metrics")
async def get_polar_metrics():
    """Get current Polar integration metrics and stats.

    Returns:
    - total_synced_products: int
    - active_subscriptions: int (Polar)
    - recent_webhooks: int
    - reconciliation_drift: dict
    """
    # TODO: Implement metrics collection from monitoring system
    return {
        "total_synced_products": 0,
        "active_subscriptions": 0,
        "recent_webhooks": 0,
        "reconciliation_drift": {},
        "last_sync": None,
        "last_reconciliation": None,
    }


@router.post("/toggle-feature-flag")
async def toggle_polar_flag(enabled: bool):
    """Toggle USE_POLAR feature flag (admin only).

    WARNING: Changing this flag affects all new checkout sessions.
    Existing subscriptions are not affected.

    Query params:
    - enabled: bool (true to enable Polar, false to disable)
    """
    # TODO: Update feature flag in feature store (LaunchDarkly, etc.)
    # For now, this would require env var update + restart

    logger.warning(
        f"Admin requested to toggle Polar flag to: {enabled} "
        "(requires restart to take effect via env var)"
    )

    return {
        "message": "Feature flag toggle requires environment variable update and restart",
        "current_value": None,  # TODO: Get from config
        "requested_value": enabled,
    }

