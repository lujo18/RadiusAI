"""
Brand HTTP endpoints - CRUD operations for brands
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.exceptions import AppError
from app.features.brand import service
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
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new brand

    Requires: Authorization: Bearer <token>
    """
    try:
        brand = await service.create_brand(db, user_id, payload)
        return brand
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


# ═════════════════════════════════════════════════
#  Read Brands
# ═════════════════════════════════════════════════


@router.get("", response_model=list[BrandListResponse])
async def list_brands(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all brands for current user

    Requires: Authorization: Bearer <token>
    """
    try:
        brands = await service.list_user_brands(db, user_id)
        return brands
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.get("/{brand_id}", response_model=BrandResponse)
async def get_brand(
    brand_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get brand details by ID

    Requires: Authorization: Bearer <token>
    """
    try:
        brand = await service.get_brand(db, brand_id, user_id)
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
    db: AsyncSession = Depends(get_db),
):
    """
    Update brand details

    Requires: Authorization: Bearer <token>
    """
    try:
        brand = await service.update_brand(db, brand_id, payload, user_id)
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
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a brand

    Requires: Authorization: Bearer <token>
    """
    try:
        await service.delete_brand(db, brand_id, user_id)
        logger.info(f"Brand deleted: {brand_id}")
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
