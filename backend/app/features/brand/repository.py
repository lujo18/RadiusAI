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

    def __init__(self, db: Optional[AsyncSession] = None, supabase=None):
        super().__init__(Brand, db=db, supabase=supabase)

    # ── Custom queries beyond base CRUD ─────────────────

    async def get_by_user(self, user_id: str, limit: int = 100) -> list[Brand]:
        """Fetch all brands owned by a user"""
        session = self._ensure_db()
        stmt = select(Brand).where(Brand.user_id == user_id).limit(limit)
        result = await session.execute(stmt)
        return result.scalars().all()

    async def get_by_team(self, team_id: str, limit: int = 100) -> list[Brand]:
        """Fetch all brands belonging to a team"""
        session = self._ensure_db()
        stmt = select(Brand).where(Brand.team_id == team_id).limit(limit)
        result = await session.execute(stmt)
        return result.scalars().all()

    async def delete_by_id(self, brand_id: str) -> None:
        """Delete brand by ID"""
        session = self._ensure_db()
        stmt = select(Brand).where(Brand.id == brand_id)
        result = await session.execute(stmt)
        brand = result.scalars().first()
        if brand:
            await session.delete(brand)
            await session.commit()
