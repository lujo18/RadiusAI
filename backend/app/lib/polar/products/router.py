"""Products router for Polar products and pricing.

This router returns a normalized, provider-agnostic product shape that
matches the frontend `Product` type in `frontend/src/types/billing.ts`.

It fetches products/prices from the Polar products repository and maps
the result into the normalized shape the frontend expects.
"""
import logging
from typing import Any, Dict

from fastapi import APIRouter, Query, HTTPException

from app.lib.polar.products.repository import get_polar_products_repository

router = APIRouter(prefix="/products", tags=["billing"])


@router.get("/", summary="List products")
async def list_products(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Return a normalized list of products and their prices.

    Normalized shape matches frontend `Product` (id, external_id, provider,
    name, description, features, prices[]).
    """
    
    logger = logging.getLogger(__name__)
    try:
        logger.info("[billing/products] made it to route")
        repo = get_polar_products_repository()
        sync_result = await repo.sync_products()
        
        products = sync_result

        return {
            "products": products,
            "limit": limit,
            "offset": offset,
        }

    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to list products: {exc}")


@router.get("/{product_id}", summary="Get product details")
async def get_product(product_id: str):
    """Return normalized product details for a single product."""
    try:
        repo = get_polar_products_repository()
        sync_result = await repo.sync_products()
        products = sync_result.get("products", []) or []
        prices = sync_result.get("prices", []) or []

        # Build price map
        prices_by_product: dict[str, list[Dict[str, Any]]] = {}
        for price in prices:
            prod_id = getattr(price, "product_id", None) or (
                price.get("product_id") if isinstance(price, dict) else None
            )
            price_id = getattr(price, "id", None) or (
                price.get("id") if isinstance(price, dict) else None
            )
            amount = getattr(price, "amount", None) or (
                price.get("amount") if isinstance(price, dict) else 0
            )
            currency = getattr(price, "currency", None) or (
                price.get("currency") if isinstance(price, dict) else "USD"
            )

            normalized_price = {
                "id": price_id,
                "external_id": price_id,
                "interval": getattr(price, "billing_period", None)
                or (price.get("billing_period") if isinstance(price, dict) else None),
                "amount": int(amount) if amount is not None else 0,
                "currency": (currency or "USD").upper(),
                "metadata": getattr(price, "metadata", None) or (
                    price.get("metadata") if isinstance(price, dict) else {}
                ),
            }
            if prod_id:
                prices_by_product.setdefault(prod_id, []).append(normalized_price)

        # Find requested product
        found = None
        for product in products:
            pid = getattr(product, "id", None) or (
                product.get("id") if isinstance(product, dict) else None
            )
            if pid == product_id:
                found = product
                break

        if not found:
            raise HTTPException(status_code=404, detail="Product not found")

        prod_id = getattr(found, "id", None) or (
            found.get("id") if isinstance(found, dict) else None
        )
        name = getattr(found, "name", None) or (
            found.get("name") if isinstance(found, dict) else ""
        )
        description = getattr(found, "description", None) or (
            found.get("description") if isinstance(found, dict) else ""
        )
        metadata = getattr(found, "metadata", None) or (
            found.get("metadata") if isinstance(found, dict) else {}
        )

        return {
            "id": prod_id,
            "external_id": prod_id,
            "provider": "polar",
            "name": name,
            "description": description,
            "features": (metadata.get("features") if isinstance(metadata, dict) else []) or [],
            "prices": prices_by_product.get(prod_id, []),
            "metadata": metadata or {},
        }

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


__all__ = ["router"]
