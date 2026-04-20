"""
Analytics Service - Business logic for post analytics and performance tracking.
"""

import logging
from typing import Optional

from app.core.database import get_db_session
from app.core.exceptions import ExternalServiceError, ValidationError
from app.features.analytics.models import PostAnalytic, PostPerformanceSummary
from app.features.analytics.repository import AnalyticsRepository, PerformanceSummaryRepository

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Service for analytics tracking and performance queries."""

    def __init__(
        self,
        analytics_repository: Optional[AnalyticsRepository] = None,
        performance_repository: Optional[PerformanceSummaryRepository] = None,
    ):
        self.analytics_repository = analytics_repository or AnalyticsRepository()
        self.performance_repository = performance_repository or PerformanceSummaryRepository()

    async def track_post_analytics(
        self,
        post_id: str,
        template_id: str,
        user_id: str,
        team_id: str,
        platform: str,
        metrics: dict,
        variant_set_id: Optional[str] = None,
    ) -> PostAnalytic:
        """Record analytics snapshot for a post."""
        try:
            if not all([post_id, team_id, platform]):
                raise ValidationError("post_id, team_id, and platform are required")
            if platform not in ["instagram", "tiktok"]:
                raise ValidationError(f"Unknown platform: {platform}")

            async with get_db_session() as db:
                analytic = await self.analytics_repository.create_analytic(
                    db=db,
                    post_id=post_id,
                    template_id=template_id,
                    user_id=user_id,
                    team_id=team_id,
                    platform=platform,
                    metrics=metrics,
                    variant_set_id=variant_set_id,
                )

            logger.info(f"Analytics tracked for post {post_id} on {platform}")
            return analytic
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Failed to track analytics: {e}", exc_info=True)
            raise ExternalServiceError("analytics", f"Analytics tracking failed: {e}")

    async def get_post_analytics(self, post_id: str, limit: int = 100) -> list[PostAnalytic]:
        """Get analytics snapshots for a post."""
        try:
            async with get_db_session() as db:
                return await self.analytics_repository.get_by_post(db, post_id, limit)
        except Exception as e:
            logger.error(f"Failed to fetch post analytics: {e}")
            raise ExternalServiceError("analytics", "Failed to fetch analytics")

    async def get_team_analytics(self, team_id: str, limit: int = 100) -> list[PostAnalytic]:
        """Get recent analytics for a team."""
        try:
            async with get_db_session() as db:
                return await self.analytics_repository.get_by_team(db, team_id, limit)
        except Exception as e:
            logger.error(f"Failed to fetch team analytics: {e}")
            raise ExternalServiceError("analytics", "Failed to fetch analytics")

    async def get_platform_analytics(
        self,
        team_id: str,
        platform: str,
        limit: int = 100,
    ) -> list[PostAnalytic]:
        """Get analytics for a specific platform."""
        try:
            if platform not in ["instagram", "tiktok"]:
                raise ValidationError(f"Unknown platform: {platform}")
            async with get_db_session() as db:
                return await self.analytics_repository.get_by_platform(db, team_id, platform, limit)
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Failed to fetch platform analytics: {e}")
            raise ExternalServiceError("analytics", "Failed to fetch analytics")

    async def calculate_performance_score(
        self,
        impressions: int,
        engagement: int,
        reach: int,
    ) -> float:
        """Calculate normalized performance score (0-100)."""
        if impressions == 0:
            return 0.0
        engagement_rate = (engagement / impressions) * 100 if impressions > 0 else 0
        reach_rate = (reach / impressions) * 100 if impressions > 0 else 0
        return min((engagement_rate * 0.6) + (reach_rate * 0.4), 100.0)

    async def aggregate_performance(
        self,
        post_id: str,
        team_id: str,
    ) -> PostPerformanceSummary:
        """Aggregate analytics data for a post and update summary."""
        try:
            async with get_db_session() as db:
                analytics_list = await self.analytics_repository.get_by_post(db, post_id, limit=1000)
                if not analytics_list:
                    return await self.performance_repository.get_or_create(db, post_id, team_id)

                total_impressions = sum(a.impressions for a in analytics_list)
                total_reach = sum(a.reach for a in analytics_list)
                total_engagement = sum(a.engagement for a in analytics_list)
                avg_engagement_rate = (
                    sum(a.engagement_rate for a in analytics_list) / len(analytics_list)
                    if analytics_list
                    else 0.0
                )
                performance_score = await self.calculate_performance_score(
                    total_impressions,
                    total_engagement,
                    total_reach,
                )

                summary = await self.performance_repository.update_summary(
                    db=db,
                    post_id=post_id,
                    total_impressions=total_impressions,
                    total_reach=total_reach,
                    total_engagement=total_engagement,
                    avg_engagement_rate=avg_engagement_rate,
                    performance_score=performance_score,
                )
                if not summary:
                    summary = await self.performance_repository.get_or_create(db, post_id, team_id)
                    summary.total_impressions = total_impressions
                    summary.total_reach = total_reach
                    summary.total_engagement = total_engagement
                    summary.avg_engagement_rate = avg_engagement_rate
                    summary.performance_score = performance_score
                    summary = await self.performance_repository.update(db, summary)

                logger.info(f"Performance aggregated for post {post_id}")
                return summary
        except Exception as e:
            logger.error(f"Failed to aggregate performance: {e}", exc_info=True)
            raise ExternalServiceError("analytics", "Performance aggregation failed")



def get_analytics_service() -> AnalyticsService:
    """Create request-scoped analytics service."""
    return AnalyticsService()


# Thin async wrappers for legacy callers that import module-level functions.

async def _with_service(operation):
    service = AnalyticsService()
    return await operation(service)


async def get_post_analytics(post_id: str, limit: int = 100):
    return await _with_service(lambda service: service.get_post_analytics(post_id, limit))


async def track_post_analytics(
    post_id: str,
    template_id: str,
    user_id: str,
    team_id: str,
    platform: str,
    metrics: dict,
    variant_set_id: Optional[str] = None,
):
    return await _with_service(
        lambda service: service.track_post_analytics(
            post_id,
            template_id,
            user_id,
            team_id,
            platform,
            metrics,
            variant_set_id,
        )
    )


async def get_team_analytics(team_id: str, limit: int = 100):
    return await _with_service(lambda service: service.get_team_analytics(team_id, limit))


async def get_platform_analytics(
    team_id: str,
    platform: str,
    limit: int = 100,
):
    return await _with_service(
        lambda service: service.get_platform_analytics(team_id, platform, limit)
    )


# Backwards-compat wrapper: some legacy callers import `create_analytic_tracker`
# from this module. Delegate to worker implementation when available.
try:
    from app.core.workers.analytics import create_analytic_tracker as _create_analytic_tracker
except Exception:
    try:
        from services.workers.analytics.create_analytic_tracker import (
            create_analytic_tracker as _create_analytic_tracker,
        )
    except Exception:
        _create_analytic_tracker = None


async def create_analytic_tracker(post_id: str):
    if _create_analytic_tracker is None:
        raise RuntimeError("create_analytic_tracker is not available in this environment")
    return await _create_analytic_tracker(post_id)


__all__ = [
    "AnalyticsService",
    "get_analytics_service",
    "get_post_analytics",
    "track_post_analytics",
    "get_team_analytics",
    "get_platform_analytics",
    "create_analytic_tracker",
]
