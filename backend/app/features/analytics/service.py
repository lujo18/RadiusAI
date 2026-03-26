"""
Analytics Service - Business logic for post analytics and performance tracking
"""

import logging
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from typing import Optional

from app.core.exceptions import NotFoundError, ValidationError, ExternalServiceError
from app.features.analytics.repository import analytics_repo, performance_repo
from app.features.analytics.models import PostAnalytic, PostPerformanceSummary

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Service for analytics tracking and performance queries."""
    
    async def track_post_analytics(
        self,
        db: AsyncSession,
        post_id: str,
        template_id: str,
        user_id: str,
        team_id: str,
        platform: str,
        metrics: dict,
        variant_set_id: Optional[str] = None
    ) -> PostAnalytic:
        """
        Record analytics snapshot for a post.
        
        Args:
            db: Database session
            post_id: Post to track
            template_id: Template used in post
            user_id: User who created post
            team_id: Team owning the post
            platform: Social platform (instagram, tiktok)
            metrics: Performance metrics dict
            variant_set_id: Optional A/B test variant
        
        Returns:
            PostAnalytic record
        
        Raises:
            ValidationError: If inputs invalid
            ExternalServiceError: If database error
        """
        try:
            if not all([post_id, team_id, platform]):
                raise ValidationError("post_id, team_id, and platform are required")
            
            if platform not in ["instagram", "tiktok"]:
                raise ValidationError(f"Unknown platform: {platform}")
            
            analytic = await analytics_repo.create_analytic(
                db,
                post_id=post_id,
                template_id=template_id,
                user_id=user_id,
                team_id=team_id,
                platform=platform,
                metrics=metrics,
                variant_set_id=variant_set_id
            )
            
            logger.info(f"Analytics tracked for post {post_id} on {platform}")
            return analytic
        
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Failed to track analytics: {e}", exc_info=True)
            raise ExternalServiceError(f"Analytics tracking failed: {str(e)}")
    
    async def get_post_analytics(
        self,
        db: AsyncSession,
        post_id: str,
        limit: int = 100
    ) -> list[PostAnalytic]:
        """Get analytics snapshots for a post."""
        try:
            analytics = await analytics_repo.get_by_post(db, post_id, limit)
            return analytics
        except Exception as e:
            logger.error(f"Failed to fetch post analytics: {e}")
            raise ExternalServiceError("Failed to fetch analytics")
    
    async def get_team_analytics(
        self,
        db: AsyncSession,
        team_id: str,
        limit: int = 100
    ) -> list[PostAnalytic]:
        """Get recent analytics for a team."""
        try:
            analytics = await analytics_repo.get_by_team(db, team_id, limit)
            return analytics
        except Exception as e:
            logger.error(f"Failed to fetch team analytics: {e}")
            raise ExternalServiceError("Failed to fetch analytics")
    
    async def get_platform_analytics(
        self,
        db: AsyncSession,
        team_id: str,
        platform: str,
        limit: int = 100
    ) -> list[PostAnalytic]:
        """Get analytics for a specific platform."""
        try:
            if platform not in ["instagram", "tiktok"]:
                raise ValidationError(f"Unknown platform: {platform}")
            
            analytics = await analytics_repo.get_by_platform(
                db, team_id, platform, limit
            )
            return analytics
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Failed to fetch platform analytics: {e}")
            raise ExternalServiceError("Failed to fetch analytics")
    
    async def calculate_performance_score(
        self,
        impressions: int,
        engagement: int,
        reach: int
    ) -> float:
        """
        Calculate normalized performance score (0-100).
        
        Weighted formula favoring engagement rate over raw numbers.
        """
        if impressions == 0:
            return 0.0
        
        engagement_rate = (engagement / impressions) * 100 if impressions > 0 else 0
        reach_rate = (reach / impressions) * 100 if impressions > 0 else 0
        
        # Weighted: 60% engagement rate, 40% reach rate
        score = (engagement_rate * 0.6) + (reach_rate * 0.4)
        
        # Cap at 100
        return min(score, 100.0)
    
    async def aggregate_performance(
        self,
        db: AsyncSession,
        post_id: str,
        team_id: str
    ) -> PostPerformanceSummary:
        """
        Aggregate analytics data for a post and update summary.
        
        Calculates totals and performance metrics from recent analytics.
        """
        try:
            # Get recent analytics for post
            analytics_list = await analytics_repo.get_by_post(db, post_id, limit=1000)
            
            if not analytics_list:
                # Create empty summary if no data
                return await performance_repo.get_or_create(db, post_id, team_id)
            
            # Aggregate metrics
            total_impressions = sum(a.impressions for a in analytics_list)
            total_reach = sum(a.reach for a in analytics_list)
            total_engagement = sum(a.engagement for a in analytics_list)
            
            avg_engagement_rate = (
                sum(a.engagement_rate for a in analytics_list) / len(analytics_list)
                if analytics_list else 0.0
            )
            
            performance_score = await self.calculate_performance_score(
                total_impressions,
                total_engagement,
                total_reach
            )
            
            # Update summary
            summary = await performance_repo.update_summary(
                db,
                post_id=post_id,
                total_impressions=total_impressions,
                total_reach=total_reach,
                total_engagement=total_engagement,
                avg_engagement_rate=avg_engagement_rate,
                performance_score=performance_score
            )
            
            logger.info(f"Performance aggregated for post {post_id}")
            return summary
        
        except Exception as e:
            logger.error(f"Failed to aggregate performance: {e}", exc_info=True)
            raise ExternalServiceError("Performance aggregation failed")


# Module-level singleton
analytics_service = AnalyticsService()
