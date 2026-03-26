"""
Platform Integration Repository - Data access layer
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
import logging

from app.shared.base_repository import BaseRepository
from app.features.integrations.models import PlatformIntegration

logger = logging.getLogger(__name__)


class IntegrationRepository(BaseRepository[PlatformIntegration]):
    """Integration data access layer with brand/platform scoping"""
    
    def __init__(self):
        super().__init__(PlatformIntegration)
    
    
    async def get_by_brand(
        self,
        db: AsyncSession,
        brand_id: str,
        limit: int = 50
    ) -> list[PlatformIntegration]:
        """Get all integrations for a brand"""
        stmt = (
            select(PlatformIntegration)
            .where(PlatformIntegration.brand_id == brand_id)
            .limit(limit)
        )
        result = await db.execute(stmt)
        return result.scalars().all()
    
    
    async def get_by_brand_and_platform(
        self,
        db: AsyncSession,
        brand_id: str,
        platform: str
    ) -> PlatformIntegration | None:
        """Get integration for specific brand and platform"""
        stmt = (
            select(PlatformIntegration)
            .where(and_(
                PlatformIntegration.brand_id == brand_id,
                PlatformIntegration.platform == platform
            ))
        )
        result = await db.execute(stmt)
        return result.scalars().first()
    
    
    async def get_by_user(
        self,
        db: AsyncSession,
        user_id: str,
        limit: int = 50
    ) -> list[PlatformIntegration]:
        """Get all integrations for a user"""
        stmt = (
            select(PlatformIntegration)
            .where(PlatformIntegration.user_id == user_id)
            .limit(limit)
        )
        result = await db.execute(stmt)
        return result.scalars().all()
    
    
    async def get_by_user_and_platform(
        self,
        db: AsyncSession,
        user_id: str,
        platform: str
    ) -> list[PlatformIntegration]:
        """Get all integrations for user on specific platform"""
        stmt = (
            select(PlatformIntegration)
            .where(and_(
                PlatformIntegration.user_id == user_id,
                PlatformIntegration.platform == platform
            ))
        )
        result = await db.execute(stmt)
        return result.scalars().all()
    
    
    async def get_by_status(
        self,
        db: AsyncSession,
        brand_id: str,
        status: str,
        limit: int = 50
    ) -> list[PlatformIntegration]:
        """Get integrations with specific status"""
        stmt = (
            select(PlatformIntegration)
            .where(and_(
                PlatformIntegration.brand_id == brand_id,
                PlatformIntegration.status == status
            ))
            .limit(limit)
        )
        result = await db.execute(stmt)
        return result.scalars().all()
    
    
    async def get_connected_integrations(
        self,
        db: AsyncSession,
        brand_id: str
    ) -> list[PlatformIntegration]:
        """Get all connected integrations for a brand"""
        stmt = (
            select(PlatformIntegration)
            .where(and_(
                PlatformIntegration.brand_id == brand_id,
                PlatformIntegration.status == "connected"
            ))
        )
        result = await db.execute(stmt)
        return result.scalars().all()
    
    
    async def delete_by_id(
        self,
        db: AsyncSession,
        integration_id: str
    ) -> bool:
        """Delete integration by ID"""
        integration = await self.get_by_id(db, integration_id)
        if not integration:
            return False
        await db.delete(integration)
        await db.flush()
        return True
