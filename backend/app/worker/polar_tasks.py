"""Scheduled tasks for Polar integration (reconciliation, retries).

Run these via APScheduler (recommended) or similar background job system.
"""

import logging
from datetime import datetime, UTC

from app.core.config import settings
from app.lib.polar.billing_service import get_polar_billing_service

logger = logging.getLogger(__name__)


async def reconcile_polar_benefits_daily():
    """Daily reconciliation task for Polar benefits and usage.

    Should run once per day (recommend: 2:00 AM UTC).

    Actions:
    - Compares Polar benefits state with local database
    - Detects usage drift
    - Flags high-drift users for manual review
    - Retries any failed syncs
    """
    if not settings.USE_POLAR:
        logger.debug("USE_POLAR is False; skipping reconciliation")
        return

    try:
        logger.info("Starting daily Polar reconciliation batch...")
        service = get_polar_billing_service()

        # Run reconciliation
        result = await service.run_daily_reconciliation()

        if result.get("reconciled"):
            users_checked = result.get("users_checked", 0)
            discrepancies = result.get("discrepancies_found", 0)
            high_drift = len(result.get("high_drift_users", []))

            logger.info(
                f"âœ“ Daily reconciliation complete: "
                f"{users_checked} checked, {discrepancies} discrepancies, "
                f"{high_drift} high-drift users"
            )

            # Alert on high drift
            if high_drift > 0:
                logger.warning(
                    f"âš  {high_drift} users with high drift detected; "
                    "manual review may be needed"
                )

        else:
            error = result.get("error", "Unknown error")
            logger.error(f"âœ— Daily reconciliation failed: {error}")

    except Exception as exc:
        logger.exception(f"Fatal error in daily reconciliation: {exc}")


async def retry_polar_sync_failures():
    """Retry task for failed Polar sync operations.

    Should run every 30 minutes.

    Actions:
    - Finds events that failed to sync to Polar
    - Retries Polar API calls with exponential backoff
    - Reports success/failure for monitoring
    """
    if not settings.USE_POLAR:
        logger.debug("USE_POLAR is False; skipping retries")
        return

    try:
        logger.info("Starting Polar sync retry batch...")
        service = get_polar_billing_service()

        # Get reconciliation service for retry logic
        from app.lib.polar.reconciliation import (
            get_polar_reconciliation_service,
        )

        recon_service = get_polar_reconciliation_service()
        result = await recon_service.sync_local_to_polar_retry()

        if result:
            succeeded = result.get("succeeded_count", 0)
            failed = result.get("failed_count", 0)
            retried = result.get("retried_count", 0)

            if succeeded > 0 or failed > 0:
                logger.info(
                    f"Polar sync retry batch: {retried} retried, "
                    f"{succeeded} succeeded, {failed} failed"
                )

            if failed > 0:
                logger.warning(f"âš  {failed} sync operations still failing")

    except Exception as exc:
        logger.exception(f"Fatal error in retry batch: {exc}")


async def check_polar_health():
    """Health check task for Polar integration.

    Should run every 15 minutes.

    Actions:
    - Verifies Polar API connectivity
    - Checks webhook health
    - Reports metrics to monitoring system
    """
    if not settings.USE_POLAR:
        return

    try:
        from app.lib.polar.billing_service import (
            get_unified_billing_service,
        )

        service = get_unified_billing_service()
        health = await service.verify_payment_processor_health()

        if health.get("healthy"):
            logger.debug("âœ“ Polar health check passed")
        else:
            errors = health.get("errors", [])
            logger.error(f"âœ— Polar health check failed: {errors}")

            # TODO: Alert monitoring system (Sentry, PagerDuty, etc.)

    except Exception as exc:
        logger.exception(f"Fatal error in health check: {exc}")


# APScheduler configuration for use in main app
POLAR_SCHEDULED_JOBS = [
    {
        "id": "polar.reconciliation.daily",
        "func": reconcile_polar_benefits_daily,
        "trigger": "cron",
        "hour": 2,
        "minute": 0,
        "timezone": "UTC",
        "description": "Daily Polar benefits reconciliation",
    },
    {
        "id": "polar.sync.retry",
        "func": retry_polar_sync_failures,
        "trigger": "interval",
        "minutes": 30,
        "description": "Retry failed Polar sync operations",
    },
    {
        "id": "polar.health.check",
        "func": check_polar_health,
        "trigger": "interval",
        "minutes": 15,
        "description": "Polar API health check",
    },
]


def add_polar_jobs_to_scheduler(scheduler):
    """Register Polar scheduled tasks with APScheduler.

    Usage in your app's startup:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        from app.worker.polar_tasks import add_polar_jobs_to_scheduler

        scheduler = AsyncIOScheduler()
        add_polar_jobs_to_scheduler(scheduler)
        scheduler.start()
    """
    for job_config in POLAR_SCHEDULED_JOBS:
        try:
            scheduler.add_job(**job_config)
            logger.info(f"Registered scheduled job: {job_config['id']}")
        except Exception as exc:
            logger.error(f"Failed to register job {job_config['id']}: {exc}")

