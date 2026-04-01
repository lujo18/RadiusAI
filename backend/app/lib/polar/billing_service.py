"""Billing service Polar integration with feature-flagging.

Extends the existing billing service to support Polar while maintaining backward
compatibility with Stripe. Routes operations based on USE_POLAR config flag.
"""

import logging
from typing import Dict, Any, Optional

from app.core.config import settings
from app.lib.polar.checkout.checkout import create_checkout_link
from app.lib.polar.products.repository import get_polar_products_repository
from app.lib.polar.reconciliation import get_polar_reconciliation_service
from app.lib.polar.errors import PolarAPIError

logger = logging.getLogger(__name__)


class PolarBillingService:
    """Feature-flagged billing helpers for Polar integration."""


    async def get_active_plans(self) -> Dict[str, Any]:
        """Fetch active billing plans from Polar or cache.

        Returns dict with keys:
        - provider: 'polar' or 'stripe'
        - plans: list of plan dicts
        - error: str (optional)
        """
        if not settings.USE_POLAR:
            logger.debug("USE_POLAR is False; delegating to Stripe")
            # TODO: Return Stripe plans
            return {"provider": "stripe", "plans": []}

        try:
            logger.info("Fetching active plans from Polar")
            repo = get_polar_products_repository()
            plans = await repo.get_plans_from_polar()

            # Map to our internal schema
            internal_plans = [repo.map_polar_to_billing_plan(plan) for plan in plans]

            return {
                "provider": "polar",
                "plans": internal_plans,
            }

        except PolarAPIError as exc:
            logger.error(f"Failed to fetch Polar plans: {exc}")
            return {
                "provider": "polar",
                "error": str(exc),
                "plans": [],
            }

    async def sync_products(self) -> Dict[str, Any]:
        """Sync Polar products to local database.

        This is typically called as a management task or during initialization.

        Returns dict with:
        - synced: bool
        - count: int (products synced)
        - error: str (optional)
        """
        if not settings.USE_POLAR:
            return {"synced": False, "error": "USE_POLAR is False"}

        try:
            logger.info("Syncing Polar products to database")
            repo = get_polar_products_repository()
            sync_result = await repo.sync_products()

            # TODO: Upsert products into billing_plans table using sync_result["products"]
            # This would involve:
            # 1. Map each Polar product via repo.map_polar_to_billing_plan()
            # 2. Upsert into DB with polar_product_id as unique key
            # 3. Handle pricing/limits updates

            return {
                "synced": True,
                "count": sync_result["count"],
            }

        except Exception as exc:
            logger.error(f"Product sync failed: {exc}")
            return {
                "synced": False,
                "error": str(exc),
            }

    async def record_usage_with_reconciliation(
        self,
        user_id: str,
        event_type: str,
        usage_count: int,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Record usage event with dual-write and reconciliation.

        Args:
            user_id: User ID
            event_type: Usage event type (e.g., 'slide_generated')
            usage_count: Units consumed
            metadata: Optional metadata

        Returns dict with:
        - recorded: bool
        - local_recorded: bool
        - polar_recorded: bool
        """
        if not settings.USE_POLAR:
            # For Stripe mode, just log locally (assume existing behavior)
            logger.debug(f"USE_POLAR is False; recording locally only")
            # TODO: Call local usage logger
            return {
                "recorded": True,
                "local_recorded": True,
                "polar_recorded": False,
            }

        try:
            recon_service = get_polar_reconciliation_service()
            result = await recon_service.log_usage_event_dual_write(
                user_id=user_id,
                event_type=event_type,
                usage_count=usage_count,
                metadata=metadata,
            )
            return result

        except Exception as exc:
            logger.error(f"Failed to record usage for user {user_id}: {exc}")
            return {
                "recorded": False,
                "error": str(exc),
            }

    async def run_daily_reconciliation(self) -> Dict[str, Any]:
        """Run daily reconciliation batch (typically scheduled as a background job).

        Returns dict with reconciliation results.
        """
        if not settings.USE_POLAR:
            return {"reconciled": False, "reason": "USE_POLAR is False"}

        try:
            logger.info("Starting daily Polar reconciliation batch")
            recon_service = get_polar_reconciliation_service()
            result = await recon_service.reconcile_daily_batch(
                batch_size=100,
                threshold_drift=10,
            )
            return result

        except Exception as exc:
            logger.error(f"Daily reconciliation failed: {exc}")
            return {
                "reconciled": False,
                "error": str(exc),
            }


# Singleton
_polar_billing_service: Optional[PolarBillingService] = None


def get_polar_billing_service() -> PolarBillingService:
    """Get or create the Polar billing service singleton."""
    global _polar_billing_service
    if _polar_billing_service is None:
        _polar_billing_service = PolarBillingService()
    return _polar_billing_service

