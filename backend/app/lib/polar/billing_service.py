"""Billing service Polar integration with feature-flagging.

Extends the existing billing service to support Polar while maintaining backward
compatibility with Stripe. Routes operations based on USE_POLAR config flag.
"""

import logging
from typing import Dict, Any, Optional

from app.core.config import settings
from app.lib.polar.checkout.checkout import (
    create_checkout_link,
    resolve_customer_from_session_token,
)
from app.lib.polar.products.repository import get_polar_products_repository
from app.lib.polar.reconciliation import get_polar_reconciliation_service
from app.lib.polar.errors import PolarAPIError
from app.features.integrations.supabase.client import get_supabase

logger = logging.getLogger(__name__)


class PolarBillingService:
    """Feature-flagged billing helpers for Polar integration."""

    def __init__(self) -> None:
        # Legacy callers and tests expect `service.polar_service`.
        self.polar_service = self

    async def get_available_plans(
        self, db: Optional[Any] = None
    ) -> list[dict[str, Any]]:
        """Backward-compatible alias for list-only active plans."""
        result = await self.get_active_plans()
        if isinstance(result, dict):
            plans = result.get("plans")
            if isinstance(plans, list):
                return plans
        return []

    async def initialize_on_startup(self, db: Optional[Any] = None) -> Dict[str, Any]:
        """Return active processor and whether required credentials exist."""
        if settings.USE_POLAR:
            configured = bool(getattr(settings, "POLAR_API_KEY", None))
            return {
                "processor": "polar",
                "configured": configured,
                "errors": [] if configured else ["POLAR_API_KEY is not configured"],
            }

        configured = bool(getattr(settings, "STRIPE_SECRET_KEY", None))
        return {
            "processor": "stripe",
            "configured": configured,
            "errors": [] if configured else ["STRIPE_SECRET_KEY is not configured"],
        }

    async def verify_payment_processor_health(self) -> Dict[str, Any]:
        """Return a simple health payload used by workers/startup checks."""
        status = await self.initialize_on_startup(None)
        return {
            "healthy": bool(status.get("configured")),
            "processor": status.get("processor"),
            "errors": status.get("errors", []),
        }

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

    async def create_checkout_session(
        self,
        user_id: Optional[str],
        product_id: str,
        success_url: str,
        cancel_url: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        team_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create a checkout session (Polar) and return normalized response.

        Returns a dict containing at minimum `provider`, and on success
        `session_id` and `checkout_url`. Errors are returned in the `error` key.
        """
        if not settings.USE_POLAR:
            logger.debug("USE_POLAR is False; cannot create Polar session")
            return {"provider": "stripe", "error": "USE_POLAR is False"}

        try:
            logger.info(
                "Creating Polar checkout session for user=%s team=%s product/price=%s",
                user_id,
                team_id,
                product_id,
            )

            # Polar checkouts are team-scoped. `external_customer_id` must be
            # the team id; do not fall back to user id.
            if not team_id or not user_id:
                logger.warning(
                    "Polar checkout requires both user_id and team_id"
                )
                return {
                    "provider": "polar",
                    "error": "Polar checkout requires both user_id and team_id",
                }

            result = create_checkout_link(
                user_id=user_id,
                team_id=team_id,
                product_id=product_id,
                success_url=success_url,
                cancel_url=cancel_url,
                metadata=metadata,
            )

            return {
                "provider": "polar",
                "session_id": result.get("id"),
                "url": result.get("url"),
                "checkout_url": result.get("url"),
                "polar_response": result.get("polar_response"),
            }

        except PolarAPIError as exc:
            logger.error("Polar checkout creation failed: %s", exc)
            return {"provider": "polar", "error": str(exc)}

    async def resolve_customer_for_checkout_session(
        self,
        customer_session_token: str,
    ) -> Dict[str, Any]:
        """Resolve Polar customer and team from a checkout session token."""
        if not settings.USE_POLAR:
            return {"provider": "stripe", "error": "USE_POLAR is False"}

        try:
            resolved = resolve_customer_from_session_token(customer_session_token)
            return {
                "provider": "polar",
                "customer_id": resolved.get("customer_id"),
                "team_id": resolved.get("team_id"),
                "session_id": resolved.get("session_id"),
                "polar_response": resolved.get("polar_response"),
            }
        except PolarAPIError as exc:
            logger.error("Polar checkout session resolution failed: %s", exc)
            return {"provider": "polar", "error": str(exc)}

    async def persist_team_link_from_checkout_session(
        self,
        customer_session_token: str,
    ) -> Dict[str, Any]:
        """Resolve checkout session context and persist team/customer linkage.

        Team id is resolved from Polar `external_customer_id` and used to
        update `teams.polar_customer_id` in Supabase.
        """
        resolved = await self.resolve_customer_for_checkout_session(
            customer_session_token
        )
        if resolved.get("error"):
            return resolved

        customer_id = resolved.get("customer_id")
        team_id = resolved.get("team_id")

        if not customer_id:
            return {
                "provider": "polar",
                "error": "customer_id could not be resolved from customer_session_token",
            }

        if not team_id:
            return {
                "provider": "polar",
                "error": "team_id could not be resolved from external_customer_id",
            }

        try:
            supabase = get_supabase()

            existing = (
                supabase.table("teams")
                .select("id")
                .eq("id", str(team_id))
                .limit(1)
                .execute()
            )
            existing_rows = getattr(existing, "data", None) or []
            if not existing_rows:
                return {
                    "provider": "polar",
                    "error": f"Team not found for external_customer_id={team_id}",
                }

            (
                supabase.table("teams")
                .update({"polar_customer_id": str(customer_id)})
                .eq("id", str(team_id))
                .execute()
            )

            return {
                "provider": "polar",
                "status": "ok",
                "team_id": str(team_id),
                "customer_id": str(customer_id),
                "session_id": resolved.get("session_id"),
                "polar_response": resolved.get("polar_response"),
            }
        except Exception as exc:
            logger.exception("Failed to persist team/customer linkage in Supabase")
            return {"provider": "polar", "error": str(exc)}

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


def get_unified_billing_service() -> PolarBillingService:
    """
    Alias for get_polar_billing_service to maintain compatibility
    with code expecting the unified billing service.
    """
    return get_polar_billing_service()
