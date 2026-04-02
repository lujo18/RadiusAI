"""Subscriptions router for Polar subscription operations"""
from fastapi import APIRouter, Depends, Query
from app.core.security import get_current_user

router = APIRouter(prefix="/subscriptions", tags=["billing"])


@router.get("/", summary="List subscriptions")
async def list_subscriptions(
    user_id: str = Depends(get_current_user),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Get all subscriptions for the current user."""
    # TODO: Implement list subscriptions
    return {
        "items": [],
        "total": 0,
        "limit": limit,
        "offset": offset,
    }


@router.get("/{subscription_id}", summary="Get subscription details")
async def get_subscription(
    subscription_id: str,
    user_id: str = Depends(get_current_user),
):
    """Get details of a specific subscription."""
    # TODO: Implement get subscription
    return {"subscription_id": subscription_id, "status": "active"}


@router.get("/{subscription_id}/invoices", summary="Get subscription invoices")
async def get_subscription_invoices(
    subscription_id: str,
    user_id: str = Depends(get_current_user),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Get all invoices for a specific subscription."""
    # TODO: Implement get subscription invoices
    return {
        "subscription_id": subscription_id,
        "items": [],
        "total": 0,
        "limit": limit,
        "offset": offset,
    }


__all__ = ["router"]
