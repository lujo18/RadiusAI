"""
Brand HTTP endpoints - CRUD operations for brands
"""

import logging
from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user
from app.core.exceptions import AppError
from app.features.brand.service import BrandService, get_brand_service
from app.features.brand.schemas import (
    BrandCreate,
    BrandUpdate,
    BrandResponse,
    BrandListResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/brands",
    tags=["brands"],
    responses={
        401: {"description": "Unauthorized"},
        404: {"description": "Not Found"},
    },
)


# ═════════════════════════════════════════════════
#  Create Brand
# ═════════════════════════════════════════════════


@router.post("", response_model=BrandResponse, status_code=201)
async def create_brand(
    payload: BrandCreate,
    user_id: str = Depends(get_current_user),
    brand_service: BrandService = Depends(get_brand_service),
):
    """
    Create a new brand

    Requires: Authorization: Bearer <token>
    """
    try:
        brand = await brand_service.create_brand(user_id, payload)
        return brand
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


# ═════════════════════════════════════════════════
#  Read Brands
# ═════════════════════════════════════════════════


@router.get("", response_model=list[BrandListResponse])
async def list_brands(
    user_id: str = Depends(get_current_user),
    brand_service: BrandService = Depends(get_brand_service),
):
    """
    List all brands for current user

    Requires: Authorization: Bearer <token>
    """
    try:
        brands = await brand_service.list_user_brands(user_id)
        return brands
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.get("/{brand_id}", response_model=BrandResponse)
async def get_brand(
    brand_id: str,
    user_id: str = Depends(get_current_user),
    brand_service: BrandService = Depends(get_brand_service),
):
    """
    Get brand details by ID

    Requires: Authorization: Bearer <token>
    """
    try:
        brand = await brand_service.get_brand(brand_id, user_id)
        return brand
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


# ═════════════════════════════════════════════════
#  Update Brand
# ═════════════════════════════════════════════════


@router.patch("/{brand_id}", response_model=BrandResponse)
async def update_brand(
    brand_id: str,
    payload: BrandUpdate,
    user_id: str = Depends(get_current_user),
    brand_service: BrandService = Depends(get_brand_service),
):
    """
    Update brand details

    Requires: Authorization: Bearer <token>
    """
    try:
        brand = await brand_service.update_brand(brand_id, payload, user_id)
        logger.info(f"Brand updated: {brand_id}")
        return brand
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


# ═════════════════════════════════════════════════
#  Delete Brand
# ═════════════════════════════════════════════════


@router.delete("/{brand_id}", status_code=204)
async def delete_brand(
    brand_id: str,
    user_id: str = Depends(get_current_user),
    brand_service: BrandService = Depends(get_brand_service),
):
    """
    Delete a brand

    Requires: Authorization: Bearer <token>
    """
    try:
        await brand_service.delete_brand(brand_id, user_id)
        logger.info(f"Brand deleted: {brand_id}")
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
