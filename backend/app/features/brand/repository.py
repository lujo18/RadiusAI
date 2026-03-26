"""
Brand repository - handles all database queries for Brand entities
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.shared.base_repository import BaseRepository
from app.features.brand.models import Brand


class BrandRepository(BaseRepository[Brand]):
    """
    Repository for Brand ORM model
    
    Usage:
        repo = BrandRepository()
        brand = await repo.get_by_id(db, brand_id)
        brands = await repo.get_by_user(db, user_id)
    """
    
    def __init__(self):
        super().__init__(Brand)
    
    # ── Custom queries beyond base CRUD ─────────────────
    
    async def get_by_user(self, db: AsyncSession, user_id: str, limit: int = 100) -> list[Brand]:
        """Fetch all brands owned by a user"""
        stmt = select(Brand).where(Brand.user_id == user_id).limit(limit)
        result = await db.execute(stmt)
        return result.scalars().all()
    
    async def get_by_team(self, db: AsyncSession, team_id: str, limit: int = 100) -> list[Brand]:
        """Fetch all brands belonging to a team"""
        stmt = select(Brand).where(Brand.team_id == team_id).limit(limit)
        result = await db.execute(stmt)
        return result.scalars().all()
    
    async def delete_by_id(self, db: AsyncSession, brand_id: str) -> None:
        """Delete brand by ID"""
        stmt = select(Brand).where(Brand.id == brand_id)
        result = await db.execute(stmt)
        brand = result.scalars().first()
        if brand:
            await db.delete(brand)
            await db.commit()
