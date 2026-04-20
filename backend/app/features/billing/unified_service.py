"""Compatibility unified billing surface.

This module preserves the historical import path
`app.features.billing.unified_service` while delegating to the current
Polar billing implementation.
"""

from __future__ import annotations

from typing import Any

from app.core.config import settings
from app.lib.polar.billing_service import (
    PolarBillingService,
    get_polar_billing_service,
)


class UnifiedBillingService:
    """Thin adapter that preserves the previous unified billing API."""

    def __init__(self, polar_service: PolarBillingService | None = None) -> None:
        self.polar_service = polar_service or get_polar_billing_service()

    async def get_available_plans(self, db: Any | None = None) -> list[dict[str, Any]]:
        """Return available plans in the legacy list-only format."""
        if not settings.USE_POLAR:
            return []

        result = await self.polar_service.get_active_plans()
        if isinstance(result, dict):
            plans = result.get("plans")
            if isinstance(plans, list):
                return plans
        return []

    async def initialize_on_startup(self, db: Any | None = None) -> dict[str, Any]:
        """Report active processor and whether required secrets are configured."""
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

    async def verify_payment_processor_health(self) -> dict[str, Any]:
        """Legacy health check shape used by startup scripts and workers."""
        status = await self.initialize_on_startup(None)
        return {
            "healthy": bool(status.get("configured")),
            "processor": status.get("processor"),
            "errors": status.get("errors", []),
        }

    async def create_checkout_session(
        self,
        db: Any,
        user_id: str,
        external_product_id: str | None = None,
        external_price_id: str | None = None,
        success_url: str = "",
        cancel_url: str | None = None,
        team_id: str | None = None,
    ) -> dict[str, Any]:
        """Create checkout via Polar billing service using legacy parameter names."""
        product_or_price = external_price_id or external_product_id
        if not product_or_price:
            return {
                "provider": "polar" if settings.USE_POLAR else "stripe",
                "error": "No product or price id supplied",
            }

        return await self.polar_service.create_checkout_session(
            user_id=user_id,
            product_price_id=product_or_price,
            success_url=success_url,
            cancel_url=cancel_url,
            team_id=team_id,
        )


_unified_billing_service: UnifiedBillingService | None = None


def get_unified_billing_service() -> UnifiedBillingService:
    """Return singleton unified billing service adapter."""
    global _unified_billing_service
    if _unified_billing_service is None:
        _unified_billing_service = UnifiedBillingService()
    return _unified_billing_service


__all__ = ["UnifiedBillingService", "get_unified_billing_service", "settings"]
