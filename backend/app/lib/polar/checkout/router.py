"""Checkout router for Polar checkout operations"""
from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.security import get_current_user
from app.features.team.service import get_current_team
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.shared.dependencies import get_db
from app.features.billing.unified_service import get_unified_billing_service

router = APIRouter(prefix="/checkout", tags=["billing"])


@router.get("/", summary="List checkout sessions")
async def list_checkout_sessions(
    user_id: str = Depends(get_current_user),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Get all checkout sessions for the current user."""
    # TODO: Implement list checkout sessions
    return {
        "items": [],
        "total": 0,
        "limit": limit,
        "offset": offset,
    }


@router.get("/{session_id}", summary="Get checkout session details")
async def get_checkout_session(
    session_id: str,
    user_id: str = Depends(get_current_user),
):
    """Get details of a specific checkout session."""
    # TODO: Implement get checkout session
    return {"session_id": session_id, "status": "pending"}


class CreateCheckoutPayload(BaseModel):
    product_price_id: str
    success_url: str
    cancel_url: Optional[str] = None


@router.post("/", summary="Create checkout session")
async def create_checkout(
    payload: CreateCheckoutPayload,
    user_id: str = Depends(get_current_user),
    team_id: Optional[str] = Depends(get_current_team),
    db: AsyncSession = Depends(get_db),
):
    """Create a checkout session using the unified billing service.

    Returns normalized session info with `session_id` and `url`.
    """
    try:
        unified = get_unified_billing_service()
        result = await unified.create_checkout_session(
            db,
            user_id,
            payload.product_price_id,
            payload.success_url,
            payload.cancel_url,
            team_id=team_id,
        )

        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


__all__ = ["router"]
