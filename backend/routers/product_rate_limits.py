import logging
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user
from services.usage import repo as usage_repo

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/product_rate_limits", tags=["product_rate_limits"])


@router.get("/")
def list_limits(user: str = Depends(get_current_user)):
    try:
        rows = usage_repo.get_all_product_rate_limits()
        return {"limits": rows}
    except Exception as e:
        logger.exception("Failed to list product_rate_limits")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{product_id}")
def get_limit(product_id: str, user: str = Depends(get_current_user)):
    try:
        row = usage_repo.get_product_rate_limit(product_id)
        if not row:
            raise HTTPException(status_code=404, detail="Limit not found")
        return row
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to fetch product rate limit")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
def upsert_limit(body: dict, user: str = Depends(get_current_user)):
    try:
        product_id = body.get("product_id")
        rules = body.get("rules")
        if not product_id:
            raise HTTPException(status_code=400, detail="product_id required")
        row = usage_repo.set_product_rate_limit(product_id, rules)
        if not row:
            raise HTTPException(status_code=500, detail="Failed to upsert limit")
        return row
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to upsert product rate limit")
        raise HTTPException(status_code=500, detail=str(e))
