"""
Analytics feature router - Post performance tracking endpoints
"""

import logging
from fastapi import APIRouter, Depends, HTTPException

from app.shared.dependencies import get_current_user, get_db
from app.features.analytics.schemas import (
    TrackAnalyticsRequest,
    PostAnalyticResponse,
    PostPerformanceResponse,
    AnalyticsQueryRequest,
    AnalyticsAggregateResponse,
)
from app.features.analytics.service import analytics_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.post("/track", response_model=PostAnalyticResponse)
async def track_analytics(
    request: TrackAnalyticsRequest,
    user_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """
    Record analytics snapshot for a post.

    Tracks impressions, engagement, and other performance metrics.
    """
    try:
        analytic = await analytics_service.track_post_analytics(
            db=db,
            post_id=request.post_id,
            template_id=request.template_id,
            user_id=user_id,
            team_id=user_id,  # TODO: Get actual team_id from context
            platform=request.platform,
            metrics={
                "impressions": request.metrics.impressions,
                "reach": request.metrics.reach,
                "engagement": request.metrics.engagement,
                "engagement_rate": request.metrics.engagement_rate,
                "saves": request.metrics.saves,
                "shares": request.metrics.shares,
                "comments": request.metrics.comments,
                "profile_visits": request.metrics.profile_visits,
                "click_through_rate": request.metrics.click_through_rate,
            },
            variant_set_id=request.variant_set_id,
        )

        return analytic

    except Exception as e:
        logger.error(f"Failed to track analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/post/{post_id}", response_model=list[PostAnalyticResponse])
async def get_post_analytics(
    post_id: str,
    limit: int = 100,
    user_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """
    Get analytics snapshots for a post.

    Returns recent performance metrics.
    """
    try:
        analytics = await analytics_service.get_post_analytics(
            db=db, post_id=post_id, limit=min(limit, 1000)
        )

        return [
            {
                **a.__dict__,
                "metrics": {
                    "impressions": a.impressions,
                    "reach": a.reach,
                    "engagement": a.engagement,
                    "engagement_rate": a.engagement_rate,
                    "saves": a.saves,
                    "shares": a.shares,
                    "comments": a.comments,
                    "profile_visits": a.profile_visits,
                    "click_through_rate": a.click_through_rate,
                },
            }
            for a in analytics
        ]

    except Exception as e:
        logger.error(f"Failed to fetch post analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/platform/{platform}", response_model=list[PostAnalyticResponse])
async def get_platform_analytics(
    platform: str,
    limit: int = 100,
    user_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """
    Get analytics for posts on a specific platform.

    Filters by instagram or tiktok.
    """
    try:
        analytics = await analytics_service.get_platform_analytics(
            db=db,
            team_id=user_id,  # TODO: Get actual team_id
            platform=platform,
            limit=min(limit, 1000),
        )

        return [
            {
                **a.__dict__,
                "metrics": {
                    "impressions": a.impressions,
                    "reach": a.reach,
                    "engagement": a.engagement,
                    "engagement_rate": a.engagement_rate,
                    "saves": a.saves,
                    "shares": a.shares,
                    "comments": a.comments,
                    "profile_visits": a.profile_visits,
                    "click_through_rate": a.click_through_rate,
                },
            }
            for a in analytics
        ]

    except Exception as e:
        logger.error(f"Failed to fetch platform analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/performance/{post_id}", response_model=PostPerformanceResponse)
async def get_performance_summary(
    post_id: str, user_id: str = Depends(get_current_user), db=Depends(get_db)
):
    """
    Get aggregated performance metrics for a post.

    Returns summary of all-time metrics and performance score.
    """
    try:
        summary = await analytics_service.aggregate_performance(
            db=db,
            post_id=post_id,
            team_id=user_id,  # TODO: Get actual team_id
        )

        return {
            "post_id": summary.post_id,
            "total_impressions": summary.total_impressions,
            "total_reach": summary.total_reach,
            "total_engagement": summary.total_engagement,
            "avg_engagement_rate": summary.avg_engagement_rate,
            "performance_score": summary.performance_score,
            "last_synced_at": summary.last_synced_at,
        }

    except Exception as e:
        logger.error(f"Failed to fetch performance summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))
