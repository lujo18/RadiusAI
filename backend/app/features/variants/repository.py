"""
Variants Repository - Data access for variant sets and performance
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, func
from typing import Optional
from uuid import uuid4

from app.shared.base_repository import BaseRepository
from app.features.variants.models import VariantSet, VariantPerfornance


class VariantSetRepository(BaseRepository[VariantSet]):
    """Repository for VariantSet ORM operations."""

    def __init__(self, db: Optional[AsyncSession] = None, supabase=None):
        super().__init__(VariantSet, db=db, supabase=supabase)

    async def get_active_by_team(self, team_id: str) -> list[VariantSet]:
        """Get active variant sets for a team."""
        stmt = (
            select(VariantSet)
            .where(and_(VariantSet.team_id == team_id, VariantSet.status == "active"))
            .order_by(desc(VariantSet.created_at))
        )
        session = self._ensure_db()
        result = await session.execute(stmt)
        return result.scalars().all()

    async def get_by_user(self, user_id: str, limit: int = 100) -> list[VariantSet]:
        """Get variant sets created by a user."""
        stmt = (
            select(VariantSet)
            .where(VariantSet.user_id == user_id)
            .order_by(desc(VariantSet.created_at))
            .limit(limit)
        )
        session = self._ensure_db()
        result = await session.execute(stmt)
        return result.scalars().all()

    async def get_completed_by_team(self, team_id: str, limit: int = 50) -> list[VariantSet]:
        """Get completed variant sets for a team."""
        stmt = (
            select(VariantSet)
            .where(
                and_(VariantSet.team_id == team_id, VariantSet.status == "completed")
            )
            .order_by(desc(VariantSet.completed_at))
            .limit(limit)
        )
        session = self._ensure_db()
        result = await session.execute(stmt)
        return result.scalars().all()


class VariantPerformanceRepository(BaseRepository[VariantPerfornance]):
    """Repository for VariantPerformance ORM operations."""

    def __init__(self, db: Optional[AsyncSession] = None, supabase=None):
        super().__init__(VariantPerfornance, db=db, supabase=supabase)

    async def get_by_variant_set(self, variant_set_id: str) -> list[VariantPerfornance]:
        """Get performance metrics for all variants in a set."""
        stmt = (
            select(VariantPerfornance)
            .where(VariantPerfornance.variant_set_id == variant_set_id)
            .order_by(desc(VariantPerfornance.overall_score))
        )
        session = self._ensure_db()
        result = await session.execute(stmt)
        return result.scalars().all()

    async def get_winner(self, variant_set_id: str) -> Optional[VariantPerfornance]:
        """Get winning variant performance."""
        stmt = select(VariantPerfornance).where(
            and_(
                VariantPerfornance.variant_set_id == variant_set_id,
                VariantPerfornance.is_winning == True,
            )
        )
        session = self._ensure_db()
        result = await session.execute(stmt)
        return result.scalars().first()


# Module-level singletons
variant_set_repo = VariantSetRepository()
variant_perf_repo = VariantPerformanceRepository()
