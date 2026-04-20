"""
Brand service - business logic for brand operations
"""

import logging
import uuid
from typing import Optional

from app.core.database import get_db_session
from app.features.brand.repository import BrandRepository
from app.features.brand.schemas import BrandCreate, BrandUpdate
from app.features.brand.models import Brand
from app.core.exceptions import NotFoundError

logger = logging.getLogger(__name__)

class BrandService:
    """Business logic for brand operations."""

    def __init__(self, repository: Optional[BrandRepository] = None):
        self.repository = repository or BrandRepository()

    async def create_brand(
        self,
        user_id: str,
        payload: BrandCreate,
        team_id: str | None = None,
    ) -> Brand:
        """Create a new brand."""
        async with get_db_session() as db:
            brand_id = f"brand_{uuid.uuid4().hex[:12]}"
            brand = Brand(
                id=brand_id,
                user_id=user_id,
                team_id=team_id,
                name=payload.name,
                description=payload.description,
                brand_settings=payload.brand_settings,
                cta_settings=payload.cta_settings,
            )
            created = await self.repository.create(db, brand)
            logger.info(f"Brand created: {brand_id} by user {user_id}")
            return created

    async def get_brand(self, brand_id: str, user_id: str | None = None) -> Brand:
        """Get brand by id."""
        async with get_db_session() as db:
            brand = await self.repository.get_by_id(db, brand_id)
            if not brand:
                raise NotFoundError("Brand", brand_id)

            if user_id and brand.user_id != user_id and brand.team_id:
                # TODO: Check if user is member of team
                pass

            return brand

    async def list_user_brands(self, user_id: str) -> list[Brand]:
        """List all brands owned by a user."""
        async with get_db_session() as db:
            return await self.repository.get_by_user(db, user_id)

    async def update_brand(
        self,
        brand_id: str,
        payload: BrandUpdate,
        user_id: str | None = None,
    ) -> Brand:
        """Update brand details."""
        async with get_db_session() as db:
            brand = await self.repository.get_by_id(db, brand_id)
            if not brand:
                raise NotFoundError("Brand", brand_id)

            if user_id and brand.user_id != user_id and brand.team_id:
                # TODO: Check if user is member of team
                pass

            if payload.name is not None:
                brand.name = payload.name
            if payload.description is not None:
                brand.description = payload.description
            if payload.brand_settings is not None:
                brand.brand_settings = payload.brand_settings
            if payload.cta_settings is not None:
                brand.cta_settings = payload.cta_settings

            updated = await self.repository.update(db, brand)
            logger.info(f"Brand updated: {brand_id}")
            return updated

    async def delete_brand(self, brand_id: str, user_id: str | None = None) -> None:
        """Delete a brand."""
        async with get_db_session() as db:
            brand = await self.repository.get_by_id(db, brand_id)
            if not brand:
                raise NotFoundError("Brand", brand_id)

            if user_id and brand.user_id != user_id and brand.team_id:
                # TODO: Check if user is member of team
                pass

            await self.repository.delete_by_id(db, brand_id)
            logger.info(f"Brand deleted: {brand_id}")


def get_brand_service() -> BrandService:
    """Create a request-scoped brand service."""
    return BrandService()


__all__ = ["BrandService", "get_brand_service"]
