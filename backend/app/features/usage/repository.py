"""
Usage Repository - Data access layer for usage metrics and quotas.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc
from typing import Optional
from uuid import uuid4

from app.shared.base_repository import BaseRepository
from app.features.usage.models import UsageMetric, UsageQuota


class UsageMetricRepository(BaseRepository[UsageMetric]):
    """Repository for UsageMetric ORM operations."""

    def __init__(self, db: Optional[AsyncSession] = None, supabase=None):
        super().__init__(UsageMetric, db=db, supabase=supabase)

    async def get_by_brand(self, brand_id: str) -> list[UsageMetric]:
        """Get all usage metrics for a brand."""
        session = self._ensure_db()
        stmt = select(UsageMetric).where(UsageMetric.brand_id == brand_id)
        result = await session.execute(stmt)
        return result.scalars().all()

    async def get_current_period(self, brand_id: str) -> Optional[UsageMetric]:
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
        session = self._ensure_db()
        result = await session.execute(stmt)
        return result.scalars().first()

    async def get_or_create_current(self, brand_id: str, user_id: str) -> UsageMetric:
        """Get current period metric or create one."""
        current = await self.get_current_period(brand_id)
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
        return await self.create(metric)

    async def increment_metric(
        self,
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

        metric = await self.get_or_create_current(brand_id, user_id)

        # Increment the specified field
        current_value = getattr(metric, metric_name, 0)
        setattr(metric, metric_name, current_value + amount)

        updated = await self.update(metric)
        return updated

    async def get_by_user(self, user_id: str) -> list[UsageMetric]:
        """Get all usage metrics for a user."""
        session = self._ensure_db()
        stmt = select(UsageMetric).where(UsageMetric.user_id == user_id)
        result = await session.execute(stmt)
        return result.scalars().all()

    async def delete_by_id(self, metric_id: str) -> bool:
        """Delete a usage metric by ID."""
        # use base get_by_id
        metric = await self.get_by_id(metric_id)
        if not metric:
            return False

        session = self._ensure_db()
        stmt = select(UsageMetric).where(UsageMetric.id == metric_id)
        result = await session.execute(stmt)
        record = result.scalars().first()

        if record:
            await session.delete(record)
            return True
        return False


class UsageQuotaRepository(BaseRepository[UsageQuota]):
    """Repository for UsageQuota ORM operations."""

    def __init__(self, db: Optional[AsyncSession] = None, supabase=None):
        super().__init__(UsageQuota, db=db, supabase=supabase)

    async def get_by_user(self, user_id: str) -> Optional[UsageQuota]:
        """Get quota configuration for a user."""
        session = self._ensure_db()
        stmt = select(UsageQuota).where(UsageQuota.user_id == user_id)
        result = await session.execute(stmt)
        return result.scalars().first()

    async def get_or_create(self, user_id: str, plan_tier: str = "free") -> UsageQuota:
        """Get user's quota or create with defaults."""
        existing = await self.get_by_user(user_id)
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
        return await self.create(quota)

    async def update_limits(self, user_id: str, **limits) -> UsageQuota:
        """Update quota limits for a user."""
        quota = await self.get_or_create(user_id)

        for key, value in limits.items():
            if hasattr(quota, key):
                setattr(quota, key, value)

        updated = await self.update(quota)
        return updated

    async def get_by_plan_tier(self, plan_tier: str) -> list[UsageQuota]:
        """Get all quotas for a plan tier."""
        session = self._ensure_db()
        stmt = select(UsageQuota).where(UsageQuota.plan_tier == plan_tier)
        result = await session.execute(stmt)
        return result.scalars().all()

    async def delete_by_user(self, user_id: str) -> bool:
        """Delete quota for a user."""
        quota = await self.get_by_user(user_id)
        if not quota:
            return False

        session = self._ensure_db()
        await session.delete(quota)
        return True
