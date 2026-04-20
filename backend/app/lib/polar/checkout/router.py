"""Checkout router for Polar checkout operations."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.features.team.service import get_current_team
from app.lib.polar.billing_service import get_unified_billing_service
from app.lib.polar.checkout.checkout import resolve_customer_from_session_token

router = APIRouter(prefix="/checkout", tags=["billing"])


@router.get("/", summary="List checkout sessions")
async def list_checkout_sessions(
    user_id: str = Depends(get_current_user),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Get all checkout sessions for the current user."""
    return {
        "items": [],
        "total": 0,
        "limit": limit,
        "offset": offset,
    }


class CheckoutPayload(BaseModel):
    product_id: str
    success_url: str
    cancel_url: Optional[str] = None


@router.post("/create")
async def create_checkout_session(
    payload: CheckoutPayload,
    user_id: str = Depends(get_current_user),
    team_id: str = Depends(get_current_team),
):
    """Create checkout session via the unified billing service."""
    service = get_unified_billing_service()
  

    result = await service.create_checkout_session(
        user_id=user_id,
        product_id=payload.product_id,
        success_url=payload.success_url,
        cancel_url=payload.cancel_url,
        team_id=team_id,
    )

    if isinstance(result, dict) and result.get("error"):
        raise HTTPException(status_code=400, detail=str(result["error"]))

    return result


@router.get("/success", summary="Polar checkout success callback")
async def checkout_success_callback(
    customer_session_token: str = Query(..., min_length=1),
):
    """Resolve team/customer from session token and persist linkage in Supabase."""
    res = await resolve_customer_from_session_token(customer_session_token)
    return RedirectResponse(
        url=settings.FRONTEND_URL + "/" + res.team_id + "/settings/billing"
    )


__all__ = ["router", "get_db", "get_current_user", "get_current_team"]
