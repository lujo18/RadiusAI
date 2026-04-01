"""
Analytics Repository - Data access for post analytics and performance metrics
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, func
from typing import Optional
from uuid import uuid4

from app.shared.base_repository import BaseRepository
from app.features.analytics.models import PostAnalytic, PostPerformanceSummary


class AnalyticsRepository(BaseRepository[PostAnalytic]):
    """Repository for PostAnalytic ORM operations."""

    def __init__(self, db: Optional[AsyncSession] = None, supabase=None):
        super().__init__(PostAnalytic, db=db, supabase=supabase)

    async def create_analytic(
        self,
        post_id: str,
        template_id: str,
        user_id: str,
        team_id: str,
        platform: str,
        metrics: dict,
        variant_set_id: Optional[str] = None,
    ) -> PostAnalytic:
        """Create a new analytics record."""
        analytic_id = f"analytic_{uuid4().hex[:12]}"

        analytic = PostAnalytic(
            id=analytic_id,
            post_id=post_id,
            template_id=template_id,
            user_id=user_id,
            team_id=team_id,
            platform=platform,
            impressions=metrics.get("impressions", 0),
            reach=metrics.get("reach", 0),
            engagement=metrics.get("engagement", 0),
            engagement_rate=metrics.get("engagement_rate", 0.0),
            saves=metrics.get("saves", 0),
            shares=metrics.get("shares", 0),
            comments=metrics.get("comments", 0),
            profile_visits=metrics.get("profile_visits", 0),
            click_through_rate=metrics.get("click_through_rate", 0.0),
            variant_set_id=variant_set_id,
        )

        return await self.create(analytic)

    async def get_by_post(self, post_id: str, limit: int = 100) -> list[PostAnalytic]:
        """Get analytics records for a post."""
        stmt = (
            select(PostAnalytic)
            .where(PostAnalytic.post_id == post_id)
            .order_by(desc(PostAnalytic.recorded_at))
            .limit(limit)
        )
        session = self._ensure_db()
        result = await session.execute(stmt)
        return result.scalars().all()

    async def get_by_team(self, team_id: str, limit: int = 100) -> list[PostAnalytic]:
        """Get recent analytics for a team."""
        stmt = (
            select(PostAnalytic)
            .where(PostAnalytic.team_id == team_id)
            .order_by(desc(PostAnalytic.recorded_at))
            .limit(limit)
        )
        session = self._ensure_db()
        result = await session.execute(stmt)
        return result.scalars().all()

    async def get_by_platform(self, team_id: str, platform: str, limit: int = 100) -> list[PostAnalytic]:
        """Get analytics for a specific platform."""
        stmt = (
            select(PostAnalytic)
            .where(
                and_(PostAnalytic.team_id == team_id, PostAnalytic.platform == platform)
            )
            .order_by(desc(PostAnalytic.recorded_at))
            .limit(limit)
        )
        session = self._ensure_db()
        result = await session.execute(stmt)
        return result.scalars().all()


class PerformanceSummaryRepository(BaseRepository[PostPerformanceSummary]):
    """Repository for PostPerformanceSummary ORM operations."""

    def __init__(self, db: Optional[AsyncSession] = None, supabase=None):
        super().__init__(PostPerformanceSummary, db=db, supabase=supabase)

    async def get_or_create(self, post_id: str, team_id: str) -> PostPerformanceSummary:
        """Get existing summary or create new one."""
        stmt = select(PostPerformanceSummary).where(
            PostPerformanceSummary.post_id == post_id
        )
        session = self._ensure_db()
        result = await session.execute(stmt)
        summary = result.scalars().first()

        if summary:
            return summary

        summary_id = f"perf_{uuid4().hex[:12]}"
        summary = PostPerformanceSummary(
            id=summary_id,
            post_id=post_id,
            team_id=team_id,
        )

        return await self.create(summary)

    async def update_summary(
        self,
        post_id: str,
        total_impressions: int,
        total_reach: int,
        total_engagement: int,
        avg_engagement_rate: float,
        performance_score: float,
    ) -> PostPerformanceSummary:
        """Update performance summary with aggregated metrics."""
        stmt = select(PostPerformanceSummary).where(
            PostPerformanceSummary.post_id == post_id
        )
        session = self._ensure_db()
        result = await session.execute(stmt)
        summary = result.scalars().first()

        if summary:
            summary.total_impressions = total_impressions
            summary.total_reach = total_reach
            summary.total_engagement = total_engagement
            summary.avg_engagement_rate = avg_engagement_rate
            summary.performance_score = performance_score

            return await self.update(summary)

        return None


# Module-level singletons
analytics_repo = AnalyticsRepository()
performance_repo = PerformanceSummaryRepository()
