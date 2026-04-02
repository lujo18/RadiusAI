"""Customer router for Polar customer operations"""
from fastapi import APIRouter, Depends, Query
from app.core.security import get_current_user

router = APIRouter(prefix="/customers", tags=["billing"])


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


__all__ = ["router"]
