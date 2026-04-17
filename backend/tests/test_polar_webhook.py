import pytest
from fastapi import FastAPI
from httpx import AsyncClient
from app.core.database import get_db
from app.features.billing import router as billing_router_mod
from app.lib.polar.webhooks import adapter as webhook_adapter_mod


class FakeAdapter:
    def validate_signature(self, raw_body: bytes, signature_header: str) -> bool:
        # Accept any signature for test purposes
        return True

    async def process_event(self, event_json: dict, save_funcs: dict) -> dict:
        # Simple echo of event id/type to simulate processing
        return {
            "processed_as": event_json.get("type", "no_op"),
            "event_id": event_json.get("data", {}).get("id"),
        }


class BadAdapter(FakeAdapter):
    def validate_signature(self, raw_body: bytes, signature_header: str) -> bool:
        return False


@pytest.mark.asyncio
async def test_polar_webhook_accepts_valid_signature(monkeypatch):
    app = FastAPI()
    app.include_router(billing_router_mod.router, prefix="/api")

    # Override DB dependency to avoid a real DB session
    async def fake_get_db():
        class DummyDB:
            async def commit(self): ...

            async def rollback(self): ...

        yield DummyDB()

    app.dependency_overrides[get_db] = fake_get_db

    # Stub the adapter to accept signatures and to process events
    monkeypatch.setattr(webhook_adapter_mod, "get_polar_webhook_adapter", lambda: FakeAdapter())

    async with AsyncClient(app=app, base_url="http://testserver") as client:
        payload = {
            "type": "subscription.created",
            "created_at": "2026-04-02T12:00:00Z",
            "data": {
                "id": "sub_test_1",
                "customer_id": "polar_c_1",
                "product_id": "prod_abc",
                "price_id": "price_123",
                "status": "active",
                "metadata": {"user_id": "user_test_1"},
            },
        }

        headers = {"x-polar-signature": "testsig"}
        resp = await client.post("/api/billing/webhook/polar", json=payload, headers=headers)

        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body.get("received") is True
        assert body.get("event_id") == "sub_test_1"


@pytest.mark.asyncio
async def test_polar_webhook_rejects_invalid_signature(monkeypatch):
    app = FastAPI()
    app.include_router(billing_router_mod.router, prefix="/api")

    async def fake_get_db():
        class DummyDB:
            async def commit(self): ...

            async def rollback(self): ...

        yield DummyDB()

    app.dependency_overrides[get_db] = fake_get_db

    # Adapter that rejects signatures
    monkeypatch.setattr(webhook_adapter_mod, "get_polar_webhook_adapter", lambda: BadAdapter())

    async with AsyncClient(app=app, base_url="http://testserver") as client:
        payload = {"type": "invoice.paid", "data": {"id": "inv_1", "metadata": {"user_id": "user_test_1"}}}
        headers = {"x-polar-signature": "badsig"}
        resp = await client.post("/api/billing/webhook/polar", json=payload, headers=headers)

        assert resp.status_code == 401
