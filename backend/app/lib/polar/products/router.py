"""Products router for Polar products and pricing"""
from fastapi import APIRouter, Depends, Query
from app.core.security import get_current_user

router = APIRouter(prefix="/products", tags=["billing"])


@router.get("/", summary="List products")
async def list_products(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Get all available products and pricing plans."""
    # TODO: Implement list products
    return {
        "items": [],
        "total": 0,
        "limit": limit,
        "offset": offset,
    }


@router.get("/{product_id}", summary="Get product details")
async def get_product(product_id: str):
    """Get details of a specific product."""
    # TODO: Implement get product
    return {"product_id": product_id}


@router.get("/invoices/", summary="List invoices")
async def list_invoices(
    user_id: str = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Get user's invoices."""
    # TODO: Implement list invoices
    return {
        "items": [],
        "total": 0,
        "limit": limit,
        "offset": offset,
    }


@router.get("/invoices/{invoice_id}", summary="Get invoice details")
async def get_invoice(
    invoice_id: str,
    user_id: str = Depends(get_current_user),
):
    """Get details of a specific invoice."""
    # TODO: Implement get invoice
    return {"invoice_id": invoice_id}


__all__ = ["router"]
