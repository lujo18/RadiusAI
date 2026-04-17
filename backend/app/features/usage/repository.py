"""
Usage Repository - Data access layer for usage metrics and quotas.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from typing import Optional
from uuid import uuid4

from app.shared.base_repository import BaseRepository
from app.features.usage.models import UsageMetric, UsageQuota


class UsageMetricRepository(BaseRepository[UsageMetric]):
    """Repository for UsageMetric ORM operations."""

    def __init__(self, supabase=None):
        super().__init__(UsageMetric, supabase=supabase)

    async def get_by_brand(self, db: AsyncSession, brand_id: str) -> list[UsageMetric]:
        """Get all usage metrics for a brand."""
        stmt = select(UsageMetric).where(UsageMetric.brand_id == brand_id)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_current_period(
        self, db: AsyncSession, brand_id: str
    ) -> Optional[UsageMetric]:
        """Get active usage metric for current billing period."""
        stmt = (
            select(UsageMetric)
            .where(
                and_(
                    UsageMetric.brand_id == brand_id,
                    UsageMetric.period_start.isnot(None),  # Active period
                )
            )
            .order_by(desc(UsageMetric.period_start))
            .limit(1)
        )
        result = await db.execute(stmt)
        return result.scalars().first()

    async def get_or_create_current(
        self, db: AsyncSession, brand_id: str, user_id: str
    ) -> UsageMetric:
        """Get current period metric or create one."""
        current = await self.get_current_period(db, brand_id)
        if current:
            return current

        # Create new metric record
        metric = UsageMetric(
            id=f"usg_{uuid4().hex[:12]}",
            brand_id=brand_id,
            user_id=user_id,
            slides_generated=0,
            images_generated=0,
            templates_created=0,
            posts_generated=0,
            ai_credits_used=0,
        )
        return await self.create(db, metric)

    async def increment_metric(
        self,
        db: AsyncSession,
        brand_id: str,
        user_id: str,
        metric_name: str,
        amount: int = 1,
    ) -> UsageMetric:
        """Increment a specific metric."""
        if metric_name not in [
            "slides_generated",
            "images_generated",
            "templates_created",
            "posts_generated",
            "ai_credits_used",
        ]:
            raise ValueError(f"Invalid metric: {metric_name}")

        metric = await self.get_or_create_current(db, brand_id, user_id)

        # Increment the specified field
        current_value = getattr(metric, metric_name, 0)
        setattr(metric, metric_name, current_value + amount)

        updated = await self.update(db, metric)
        return updated

    async def get_by_user(self, db: AsyncSession, user_id: str) -> list[UsageMetric]:
        """Get all usage metrics for a user."""
        stmt = select(UsageMetric).where(UsageMetric.user_id == user_id)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def delete_by_id(self, db: AsyncSession, metric_id: str) -> bool:
        """Delete a usage metric by ID."""
        stmt = select(UsageMetric).where(UsageMetric.id == metric_id)
        result = await db.execute(stmt)
        record = result.scalars().first()

        if record:
            await db.delete(record)
            await db.flush()
            return True
        return False


class UsageQuotaRepository(BaseRepository[UsageQuota]):
    """Repository for UsageQuota ORM operations."""

    def __init__(self, supabase=None):
        super().__init__(UsageQuota, supabase=supabase)

    async def get_by_user(self, db: AsyncSession, user_id: str) -> Optional[UsageQuota]:
        """Get quota configuration for a user."""
        stmt = select(UsageQuota).where(UsageQuota.user_id == user_id)
        result = await db.execute(stmt)
        return result.scalars().first()

    async def get_or_create(
        self, db: AsyncSession, user_id: str, plan_tier: str = "free"
    ) -> UsageQuota:
        """Get user's quota or create with defaults."""
        existing = await self.get_by_user(db, user_id)
        if existing:
            return existing

        # Create default quota for plan tier
        quota = UsageQuota(
            id=f"quo_{uuid4().hex[:12]}",
            user_id=user_id,
            plan_tier=plan_tier,
            slides_limit=None,  # Defaults per tier set in service
            images_limit=None,
            templates_limit=None,
            posts_limit=None,
            ai_credits_limit=None,
            brands_limit=5 if plan_tier == "free" else None,
        )
        return await self.create(db, quota)

    async def update_limits(self, db: AsyncSession, user_id: str, **limits) -> UsageQuota:
        """Update quota limits for a user."""
        quota = await self.get_or_create(db, user_id)

        for key, value in limits.items():
            if hasattr(quota, key):
                setattr(quota, key, value)

        updated = await self.update(db, quota)
        return updated

    async def get_by_plan_tier(
        self, db: AsyncSession, plan_tier: str
    ) -> list[UsageQuota]:
        """Get all quotas for a plan tier."""
        stmt = select(UsageQuota).where(UsageQuota.plan_tier == plan_tier)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def delete_by_user(self, db: AsyncSession, user_id: str) -> bool:
        """Delete quota for a user."""
        stmt = select(UsageQuota).where(UsageQuota.user_id == user_id)
        result = await db.execute(stmt)
        quota = result.scalars().first()
        if not quota:
            return False

        await db.delete(quota)
        await db.flush()
        return True


    __all__ = ["UsageMetricRepository", "UsageQuotaRepository"]
