"""Compatibility billing router for Polar webhook tests."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.lib.polar.webhooks import adapter as webhook_adapter_mod

router = APIRouter(prefix="/billing", tags=["billing"])


async def _noop_save(*args: Any, **kwargs: Any) -> dict[str, Any]:
    return {}


@router.post("/webhook/polar")
async def polar_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_polar_signature: str | None = Header(default=None, alias="x-polar-signature"),
) -> dict[str, Any]:
    """Accept and process Polar webhook payloads."""
    if not x_polar_signature:
        raise HTTPException(status_code=401, detail="Missing Polar signature")

    raw_body = await request.body()
    adapter = webhook_adapter_mod.get_polar_webhook_adapter()

    if not adapter.validate_signature(raw_body, x_polar_signature):
        raise HTTPException(status_code=401, detail="Invalid Polar signature")

    event_json = await request.json()
    result = await adapter.process_event(
        event_json,
        {
            "save_subscription": _noop_save,
            "update_subscription": _noop_save,
            "cancel_subscription": _noop_save,
            "save_invoice": _noop_save,
        },
    )

    return {
        "received": True,
        "processed_as": result.get("processed_as"),
        "event_id": result.get("event_id"),
    }


__all__ = ["router"]
