import pytest


def test_get_available_plans_returns_polar_plans(monkeypatch):
    # Import here to avoid import-time DB engine creation during test collection
    import asyncio
    from app.features.billing.unified_service import get_unified_billing_service
    from app.core.config import settings

    svc = get_unified_billing_service()

    async def fake_get_active_plans():
        return {
            "provider": "polar",
            "plans": [
                {
                    "polar_product_id": "prod_1",
                    "polar_price_id": "pr_1",
                    "name": "Pro Plan",
                    "description": "Pro tier",
                    "amount": 2000,
                    "currency": "USD",
                    "billing_period": "monthly",
                    "features": {"slides": True},
                    "limits": {"max_slides": 100},
                    "price_amount": 2000,
                }
            ],
        }

    monkeypatch.setattr(svc.polar_service, "get_active_plans", fake_get_active_plans)
    monkeypatch.setattr(settings, "USE_POLAR", True)

    plans = asyncio.run(svc.get_available_plans(None))

    assert isinstance(plans, list)
    assert len(plans) == 1
    assert plans[0]["polar_product_id"] == "prod_1"
