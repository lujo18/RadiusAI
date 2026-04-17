import pytest
from fastapi import FastAPI
from httpx import AsyncClient

from app.features.generate import router as generate_router_mod
import app.features.posts.utilities.slide_generation as slide_generation_util_mod
import app.features.usage.service as usage_service_mod


@pytest.mark.asyncio
async def test_generate_post_auto_invalid_template_returns_422(monkeypatch):
    app = FastAPI()
    app.include_router(generate_router_mod.router, prefix="/api/v1")
    app.dependency_overrides[generate_router_mod.get_current_user] = lambda: "user_test"

    def _raise_payload_error(**_kwargs):
        raise ValueError("template payload is missing required field: id")

    monkeypatch.setattr(
        slide_generation_util_mod, "generate_slideshows", _raise_payload_error
    )
    monkeypatch.setattr(
        usage_service_mod,
        "check_generation_credits",
        lambda _user_id, _slides: {"allowed": True},
    )
    monkeypatch.setattr(
        usage_service_mod,
        "track_slides_generated",
        lambda _user_id, _count: None,
    )

    payload = {
        "template": {"name": "Missing ID template"},
        "brand_settings": {"name": "Brand"},
        "brand_id": "brand_1",
        "count": 1,
    }

    async with AsyncClient(app=app, base_url="http://testserver") as client:
        response = await client.post("/api/v1/generate/post/auto", json=payload)

    assert response.status_code == 422
    assert "missing required field: id" in response.json().get("detail", "")
