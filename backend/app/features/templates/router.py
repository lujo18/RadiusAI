"""
Template HTTP endpoints - CRUD operations for templates
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.exceptions import AppError
from app.features.templates import service
from app.features.templates.schemas import (
    TemplateCreate, TemplateUpdate, TemplateResponse, TemplateListResponse
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/templates",
    tags=["templates"],
    responses={
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden"},
        404: {"description": "Not Found"},
    }
)


# ═════════════════════════════════════════════════
#  Create Template
# ═════════════════════════════════════════════════

@router.post("", response_model=TemplateResponse, status_code=201)
async def create_template(
    brand_id: str,
    payload: TemplateCreate,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new template for a brand.
    
    Requires: Authorization: Bearer <token>
    """
    try:
        template = await service.create_template(db, user_id, brand_id, payload)
        return template
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


# ═════════════════════════════════════════════════
#  Read Templates
# ═════════════════════════════════════════════════

@router.get("/brand/{brand_id}", response_model=list[TemplateListResponse])
async def list_brand_templates(
    brand_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all templates for a brand.
    
    Requires: Authorization: Bearer <token>
    """
    try:
        templates = await service.list_brand_templates(db, brand_id, user_id)
        return templates
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.get("/my/all", response_model=list[TemplateListResponse])
async def list_my_templates(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all templates created by current user.
    
    Requires: Authorization: Bearer <token>
    """
    try:
        templates = await service.list_user_templates(db, user_id)
        return templates
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.get("/my/favorites", response_model=list[TemplateListResponse])
async def list_favorite_templates(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List user's favorite templates.
    
    Requires: Authorization: Bearer <token>
    """
    try:
        templates = await service.list_favorite_templates(db, user_id)
        return templates
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.get("/defaults", response_model=list[TemplateListResponse])
async def get_default_templates(
    db: AsyncSession = Depends(get_db),
):
    """
    Get system default templates (public, no auth required).
    """
    try:
        templates = await service.get_default_templates(db)
        return templates
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get template details by ID.
    
    Requires: Authorization: Bearer <token>
    """
    try:
        template = await service.get_template(db, template_id, user_id)
        return template
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


# ═════════════════════════════════════════════════
#  Update Template
# ═════════════════════════════════════════════════

@router.patch("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: str,
    payload: TemplateUpdate,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update template details.
    
    Requires: Authorization: Bearer <token>
    """
    try:
        template = await service.update_template(db, template_id, payload, user_id)
        logger.info(f"Template updated: {template_id}")
        return template
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.post("/{template_id}/favorite", response_model=TemplateResponse)
async def toggle_favorite(
    template_id: str,
    is_favorite: bool = True,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Toggle template favorite status.
    
    Requires: Authorization: Bearer <token>
    """
    try:
        template = await service.toggle_favorite(db, template_id, is_favorite, user_id)
        return template
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


# ═════════════════════════════════════════════════
#  Delete Template
# ═════════════════════════════════════════════════

@router.delete("/{template_id}", status_code=204)
async def delete_template(
    template_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a template.
    
    Requires: Authorization: Bearer <token>
    """
    try:
        await service.delete_template(db, template_id, user_id)
        logger.info(f"Template deleted: {template_id}")
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


# ═════════════════════════════════════════════════
#  Search Templates
# ═════════════════════════════════════════════════

@router.get("/search/category/{category}", response_model=list[TemplateListResponse])
async def search_by_category(
    category: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Search templates by category.
    
    Requires: Authorization: Bearer <token>
    """
    try:
        templates = await service.search_by_category(db, category, user_id)
        return templates
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.post("/search/tags", response_model=list[TemplateListResponse])
async def search_by_tags(
    tags: list[str],
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Search templates by tags.
    
    Requires: Authorization: Bearer <token>
    """
    try:
        templates = await service.search_by_tags(db, tags, user_id)
        return templates
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
