import pytest

from app.lib.polar.products.repository import PolarProductsRepository


@pytest.mark.asyncio
async def test_get_product_id_for_price_from_sync(monkeypatch):
    repo = PolarProductsRepository()

    async def fake_sync_products():
        return {
            "products": [],
            "prices": [
                {"id": "price_123", "product_id": "prod_abc", "amount": 1000, "currency": "USD"}
            ],
            "synced_at": None,
            "count": 1,
        }

    monkeypatch.setattr(repo, "sync_products", fake_sync_products)

    resolved = await repo.get_product_id_for_price("price_123")
    assert resolved == "prod_abc"


def test_map_polar_to_billing_plan_basic():
    repo = PolarProductsRepository()

    polar_plan = {
        "polar_product_id": "prod_1",
        "polar_price_id": "pr_1",
        "name": "Pro Plan",
        "amount": 2000,
        "currency": "USD",
        "billing_period": "monthly",
        "features": {"list": ["f1"]},
        "limits": {"max": 10},
    }

    mapped = repo.map_polar_to_billing_plan(polar_plan)

    assert mapped["stripe_product_id"] == "prod_1"
    assert mapped["stripe_price_id"] == "pr_1"
    assert mapped["tier"] == "pro"
    assert mapped["price_amount"] == 2000
    assert mapped["payment_processor"] == "polar"
