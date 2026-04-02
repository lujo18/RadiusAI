"""Webhooks router for Polar webhook events"""
from fastapi import APIRouter, Depends, Query
from app.core.security import require_admin

router = APIRouter(prefix="/webhooks", tags=["billing"])


@router.get("/status", summary="Get webhook status")
async def get_webhook_status(admin_user: str = Depends(require_admin)):
    """Get the status and health of webhook endpoints."""
    # TODO: Implement get webhook status
    return {
        "status": "operational",
        "last_event": None,
        "failure_count": 0,
        "success_count": 0,
    }


@router.get("/events", summary="List webhook events")
async def list_webhook_events(
    admin_user: str = Depends(require_admin),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    event_type: str = Query(None),
):
    """List recent webhook events (admin only)."""
    # TODO: Implement list webhook events
    return {
        "items": [],
        "total": 0,
        "limit": limit,
        "offset": offset,
        "event_type_filter": event_type,
    }


@router.get("/events/{event_id}", summary="Get webhook event details")
async def get_webhook_event(
    event_id: str,
    admin_user: str = Depends(require_admin),
):
    """Get details of a specific webhook event."""
    # TODO: Implement get webhook event
    return {"event_id": event_id}


__all__ = ["router"]
