"""Customer router for Polar customer operations."""

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.config import settings
from app.core.security import get_current_user
from app.features.team.service import get_current_team
from app.lib.polar.customer.service import create_customer_portal_session

router = APIRouter(prefix="/customers", tags=["billing"])
portal_router = APIRouter(tags=["billing"])


@portal_router.post("/portal", summary="Create customer portal session")
async def create_portal_session(
    user_id: str = Depends(get_current_user),
    team_id: str = Depends(get_current_team),
):
    """Create a Polar customer portal session URL for the current team."""
    # Keep users on billing settings after leaving the portal.
    return_url = f"{settings.FRONTEND_URL}/{team_id}/settings/billing"

    try:
        return create_customer_portal_session(team_id=team_id, return_url=return_url)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/me", summary="Get current customer info")
async def get_current_customer(
    user_id: str = Depends(get_current_user),
):
    """Get the current authenticated customer's information."""
    # TODO: Implement get current customer
    return {
        "customer_id": user_id,
        "email": None,
        "name": None,
        "created_at": None,
    }


@router.get("/", summary="List customers")
async def list_customers(
    user_id: str = Depends(get_current_user),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """List customers (admin only)."""
    # TODO: Implement list customers
    return {
        "items": [],
        "total": 0,
        "limit": limit,
        "offset": offset,
    }


@router.get("/{customer_id}", summary="Get customer details")
async def get_customer(
    customer_id: str,
    user_id: str = Depends(get_current_user),
):
    """Get details of a specific customer."""
    # TODO: Implement get customer
    return {"customer_id": customer_id}


__all__ = ["router", "portal_router"]
