"""
Usage Router - HTTP endpoints for quota tracking and enforcement.

Endpoints:
- GET /usage/summary - Get comprehensive usage and quota summary
- GET /usage/quota - Get user's quota configuration
- POST /usage/consume - Consume quota with enforcement (raises error if limit exceeded)
- POST /usage/track - Track usage without enforcement
- GET /usage/brand/{brand_id} - Get usage metrics for a specific brand
- POST /usage/sync-period - Sync billing period from Stripe
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.exceptions import AppError, ValidationError, QuotaExceededError
from app.features.usage.service import usage_service
from app.features.usage.schemas import (
    ConsumeUsageRequest,
    TrackUsageRequest,
    UsageSummaryResponse,
    UsageQuotaResponse,
    ConsumeResponse,
    UsageMetricResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/usage", tags=["usage"])


@router.get("/summary", response_model=UsageSummaryResponse)
async def get_usage_summary(
    brand_id: str = Query(..., description="Brand ID to check usage for"),
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get comprehensive usage and quota summary for a brand.
    
    Returns current usage metrics, quota limits, and per-metric status.
    """
    try:
        summary = await usage_service.get_usage_summary(db, user_id, brand_id)
        await db.commit()
        return summary
    except AppError as e:
        logger.warning(f"Usage summary fetch failed: {e}")
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        logger.exception("Unexpected error fetching usage summary")
        raise HTTPException(status_code=500, detail="Failed to fetch usage summary")


@router.get("/quota", response_model=UsageQuotaResponse)
async def get_user_quota(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get user's current quota configuration and plan tier.
    """
    try:
        quota = await usage_service.get_user_quota(db, user_id)
        await db.commit()
        return UsageQuotaResponse.model_validate(quota)
    except AppError as e:
        logger.warning(f"Quota fetch failed: {e}")
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        logger.exception("Unexpected error fetching quota")
        raise HTTPException(status_code=500, detail="Failed to fetch quota")


@router.post("/consume", response_model=ConsumeResponse, status_code=200)
async def consume_quota(
    request: ConsumeUsageRequest,
    brand_id: str = Query(..., description="Brand ID to consume quota for"),
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Consume quota with enforcement.
    
    Raises QuotaExceededError (403) if limit would be exceeded.
    
    Metrics:
    - slides_generated: AI-generated slides
    - images_generated: Generated images
    - templates_created: Custom templates
    - posts_generated: Generated posts
    - ai_credits_used: AI credits
    """
    try:
        result = await usage_service.consume_quota(
            db, user_id, brand_id, request.metric, request.amount
        )
        await db.commit()
        return result
    except QuotaExceededError as e:
        await db.rollback()
        logger.info(f"Quota exceeded for user {user_id}: {e}")
        raise HTTPException(status_code=402, detail=e.message)
    except ValidationError as e:
        await db.rollback()
        logger.warning(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=e.message)
    except AppError as e:
        await db.rollback()
        logger.warning(f"Quota consumption failed: {e}")
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        await db.rollback()
        logger.exception("Unexpected error consuming quota")
        raise HTTPException(status_code=500, detail="Failed to consume quota")


@router.post("/track", response_model=UsageMetricResponse)
async def track_usage(
    request: TrackUsageRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Track usage without enforcing quota limits.
    
    Use this for analytics and tracking that shouldn't trigger quota errors.
    """
    try:
        brand_id = request.brand_id
        if not brand_id:
            raise ValidationError("brand_id is required")
        
        metric = await usage_service.track_usage(
            db, user_id, brand_id, request.metric, request.amount
        )
        await db.commit()
        return UsageMetricResponse.model_validate(metric)
    except ValidationError as e:
        await db.rollback()
        logger.warning(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=e.message)
    except AppError as e:
        await db.rollback()
        logger.warning(f"Usage tracking failed: {e}")
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        await db.rollback()
        logger.exception("Unexpected error tracking usage")
        raise HTTPException(status_code=500, detail="Failed to track usage")


@router.get("/brand/{brand_id}", response_model=UsageMetricResponse)
async def get_brand_usage(
    brand_id: str = Path(..., description="Brand ID"),
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get current billing period usage for a specific brand.
    """
    try:
        metric = await usage_service.get_brand_current_usage(db, brand_id, user_id)
        await db.commit()
        return UsageMetricResponse.model_validate(metric)
    except AppError as e:
        logger.warning(f"Brand usage fetch failed: {e}")
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        logger.exception("Unexpected error fetching brand usage")
        raise HTTPException(status_code=500, detail="Failed to fetch brand usage")


@router.post("/sync-period", response_model=UsageMetricResponse)
async def sync_billing_period(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Sync billing period from Stripe subscription.
    
    Sets period_start/period_end for quota tracking.
    """
    try:
        metric = await usage_service.sync_period_from_stripe(db, user_id)
        if not metric:
            raise ValueError("No usage metrics found for user")
        
        await db.commit()
        return UsageMetricResponse.model_validate(metric)
    except AppError as e:
        await db.rollback()
        logger.warning(f"Period sync failed: {e}")
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        await db.rollback()
        logger.exception("Unexpected error syncing period")
        raise HTTPException(status_code=500, detail="Failed to sync billing period")


# ═════════ DEBUG ENDPOINTS ═════════

@router.get("/debug/check", response_model=dict)
async def debug_quota_check(
    metric: str = Query(..., description="Metric to check"),
    amount: int = Query(1, ge=1, description="Amount to check"),
    brand_id: str = Query(..., description="Brand ID"),
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Debug endpoint: Check quota status for a metric without consuming.
    """
    try:
        check = await usage_service.check_quota(db, user_id, brand_id, metric, amount)
        await db.commit()
        return check.model_dump()
    except Exception as e:
        logger.exception("Debug check failed")
        raise HTTPException(status_code=500, detail=str(e))
