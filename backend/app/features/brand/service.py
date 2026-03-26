"""
Brand service - business logic for brand operations
"""

import logging
import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.brand.repository import BrandRepository
from app.features.brand.schemas import BrandCreate, BrandUpdate
from app.features.brand.models import Brand
from app.core.exceptions import NotFoundError, ConflictError

logger = logging.getLogger(__name__)

repository = BrandRepository()


# ════════════════════════════════
#  CREATE
# ════════════════════════════════

async def create_brand(
    db: AsyncSession,
    user_id: str,
    payload: BrandCreate,
    team_id: str | None = None,
) -> Brand:
    """
    Create a new brand
    
    Args:
        db: Database session
        user_id: User creating the brand
        payload: Brand creation data
        team_id: (optional) Team to assign brand to
    
    Returns:
        Created Brand
    """
    # Generate unique brand ID
    brand_id = f"brand_{uuid.uuid4().hex[:12]}"
    
    # Create new brand
    brand = Brand(
        id=brand_id,
        user_id=user_id,
        team_id=team_id,
        name=payload.name,
        description=payload.description,
        brand_settings=payload.brand_settings,
        cta_settings=payload.cta_settings,
    )
    
    # Persist to database
    created = await repository.create(db, brand)
    logger.info(f"Brand created: {brand_id} by user {user_id}")
    return created


# ════════════════════════════════
#  READ
# ════════════════════════════════

async def get_brand(db: AsyncSession, brand_id: str, user_id: str | None = None) -> Brand:
    """
    Get brand by ID
    
    Args:
        db: Database session
        brand_id: Brand ID to fetch
        user_id: (optional) For RLS check - verify user owns/has access to brand
    
    Raises:
        NotFoundError: If brand does not exist
    """
    brand = await repository.get_by_id(db, brand_id)
    if not brand:
        raise NotFoundError("Brand", brand_id)
    
    # RLS: Optionally verify user has access
    if user_id and brand.user_id != user_id and brand.team_id:
        # TODO: Check if user is member of team
        pass
    
    return brand


async def list_user_brands(db: AsyncSession, user_id: str) -> list[Brand]:
    """
    List all brands owned by a user
    
    Args:
        db: Database session
        user_id: User ID to fetch brands for
    
    Returns:
        List of Brand objects
    """
    brands = await repository.get_by_user(db, user_id)
    return brands


# ════════════════════════════════
#  UPDATE
# ════════════════════════════════

async def update_brand(
    db: AsyncSession,
    brand_id: str,
    payload: BrandUpdate,
    user_id: str | None = None,
) -> Brand:
    """
    Update brand details
    
    Args:
        db: Database session
        brand_id: Brand ID to update
        payload: Update data
        user_id: (optional) For RLS check
    
    Raises:
        NotFoundError: If brand does not exist
    """
    brand = await get_brand(db, brand_id, user_id)
    
    # Update fields if provided
    if payload.name is not None:
        brand.name = payload.name
    if payload.description is not None:
        brand.description = payload.description
    if payload.brand_settings is not None:
        brand.brand_settings = payload.brand_settings
    if payload.cta_settings is not None:
        brand.cta_settings = payload.cta_settings
    
    # Persist changes
    updated = await repository.update(db, brand)
    logger.info(f"Brand updated: {brand_id}")
    return updated


# ════════════════════════════════
#  DELETE
# ════════════════════════════════

async def delete_brand(db: AsyncSession, brand_id: str, user_id: str | None = None) -> None:
    """
    Delete a brand
    
    Args:
        db: Database session
        brand_id: Brand ID to delete
        user_id: (optional) For RLS check
    
    Raises:
        NotFoundError: If brand does not exist
    """
    # Verify exists first
    brand = await get_brand(db, brand_id, user_id)
    
    # Delete
    await repository.delete_by_id(db, brand_id)
    logger.info(f"Brand deleted: {brand_id}")
