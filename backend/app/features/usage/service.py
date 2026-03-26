"""
Usage Service - Business logic for quota tracking and rate limiting.

Manages:
- Usage metric tracking (slides, images, templates, posts, AI credits)
- Quota enforcement (check remaining, consume, enforce limits)
- Billing period management
- Plan tier quotas
"""

from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta, UTC
from typing import Optional

from app.core.exceptions import QuotaExceededError, ValidationError, NotFoundError
from app.features.usage.models import UsageMetric, UsageQuota
from app.features.usage.schemas import (
    QuotaCheckResponse, 
    ConsumeResponse, 
    UsageSummaryResponse,
    UsageMetricResponse,
    UsageQuotaResponse,
)
from app.features.usage.repository import UsageMetricRepository, UsageQuotaRepository


# ═════════ PLAN TIER DEFAULTS ═════════

PLAN_TIER_QUOTAS = {
    "free": {
        "slides_limit": 50,
        "images_limit": 10,
        "templates_limit": 3,
        "posts_limit": 50,
        "ai_credits_limit": 100,
        "brands_limit": 1,
    },
    "pro": {
        "slides_limit": 500,
        "images_limit": 100,
        "templates_limit": 20,
        "posts_limit": 1000,
        "ai_credits_limit": 5000,
        "brands_limit": 5,
    },
    "agency": {
        "slides_limit": None,  # Unlimited
        "images_limit": None,
        "templates_limit": None,
        "posts_limit": None,
        "ai_credits_limit": None,
        "brands_limit": None,
    },
}

# Module-level repo singletons
metric_repo = UsageMetricRepository()
quota_repo = UsageQuotaRepository()


class UsageMetricService:
    """Service for usage metric operations."""
    
    async def get_user_quota(
        self, 
        db: AsyncSession, 
        user_id: str
    ) -> UsageQuota:
        """Get or create user's quota configuration."""
        quota = await quota_repo.get_or_create(db, user_id)
        return quota
    
    async def get_brand_current_usage(
        self, 
        db: AsyncSession, 
        brand_id: str,
        user_id: str
    ) -> UsageMetric:
        """Get current billing period usage for a brand."""
        current = await metric_repo.get_current_period(db, brand_id)
        if current:
            return current
        
        # Create new period if doesn't exist
        return await metric_repo.get_or_create_current(db, brand_id, user_id)
    
    async def check_quota(
        self, 
        db: AsyncSession, 
        user_id: str,
        brand_id: str,
        metric: str,
        amount: int = 1
    ) -> QuotaCheckResponse:
        """
        Check if user can consume `amount` units of `metric`.
        
        Returns quota check response with allowed/remaining status.
        """
        if metric not in [
            "slides_generated", 
            "images_generated", 
            "templates_created",
            "posts_generated", 
            "ai_credits_used",
            "brands_limit"  # Special: global limit across all brands
        ]:
            raise ValidationError(f"Unknown metric: {metric}")
        
        # Get current usage
        usage = await self.get_brand_current_usage(db, brand_id, user_id)
        current_usage = getattr(usage, metric, 0)
        
        # Get user's quota limit
        quota = await self.get_user_quota(db, user_id)
        limit = getattr(quota, f"{metric}", None)
        
        # Check if unlimited
        if limit is None:
            allowed = True
            remaining = None
            percentage_used = None
        else:
            # Check if consumption is allowed
            remaining = limit - current_usage
            allowed = remaining >= amount
            percentage_used = min(100.0, (current_usage / limit * 100)) if limit > 0 else 0.0
        
        return QuotaCheckResponse(
            metric=metric,
            current_usage=current_usage,
            limit=limit,
            remaining=remaining,
            allowed=allowed,
            percentage_used=percentage_used,
        )
    
    async def consume_quota(
        self, 
        db: AsyncSession, 
        user_id: str,
        brand_id: str,
        metric: str,
        amount: int = 1
    ) -> ConsumeResponse:
        """
        Attempt to consume quota. Raises QuotaExceededError if limit exceeded.
        """
        # Check if allowed
        check = await self.check_quota(db, user_id, brand_id, metric, amount)
        
        if not check.allowed:
            raise QuotaExceededError(
                f"Cannot consume {amount} {metric}. "
                f"Limit: {check.limit}, Remaining: {check.remaining}"
            )
        
        # Consume the quota
        updated = await metric_repo.increment_metric(
            db, brand_id, user_id, metric, amount
        )
        
        # Get updated check
        new_check = await self.check_quota(db, user_id, brand_id, metric, 0)
        
        return ConsumeResponse(
            allowed=True,
            consumed=amount,
            new_total=new_check.current_usage,
            quota_check=new_check,
        )
    
    async def track_usage(
        self, 
        db: AsyncSession, 
        user_id: str,
        brand_id: str,
        metric: str,
        amount: int = 1
    ) -> UsageMetric:
        """Track usage without enforcing quota (for analytics)."""
        updated = await metric_repo.increment_metric(
            db, brand_id, user_id, metric, amount
        )
        return updated
    
    async def get_usage_summary(
        self, 
        db: AsyncSession, 
        user_id: str,
        brand_id: str
    ) -> UsageSummaryResponse:
        """Get comprehensive usage and quota summary."""
        metrics = await self.get_brand_current_usage(db, brand_id, user_id)
        quota = await self.get_user_quota(db, user_id)
        
        # Check all metrics
        metric_names = [
            "slides_generated", 
            "images_generated", 
            "templates_created",
            "posts_generated", 
            "ai_credits_used"
        ]
        
        checks = []
        for metric_name in metric_names:
            check = await self.check_quota(db, user_id, brand_id, metric_name, 0)
            checks.append(check)
        
        # Determine if period is active (has start/end dates)
        period_active = (
            metrics.period_start is not None and 
            metrics.period_end is not None
        )
        
        return UsageSummaryResponse(
            brand_id=brand_id,
            metrics=UsageMetricResponse.model_validate(metrics),
            quotas=UsageQuotaResponse.model_validate(quota),
            checks=checks,
            period_active=period_active,
            period_start=metrics.period_start,
            period_end=metrics.period_end,
        )
    
    async def set_plan_tier(
        self, 
        db: AsyncSession, 
        user_id: str,
        plan_tier: str
    ) -> UsageQuota:
        """Update user's plan tier and associated quotas."""
        if plan_tier not in PLAN_TIER_QUOTAS:
            raise ValidationError(f"Invalid plan tier: {plan_tier}")
        
        quota = await quota_repo.get_or_create(db, user_id, plan_tier)
        quota.plan_tier = plan_tier
        
        # Apply tier defaults
        limits = PLAN_TIER_QUOTAS[plan_tier]
        for key, value in limits.items():
            setattr(quota, key, value)
        
        updated = await quota_repo.update(db, quota)
        return updated
    
    async def sync_period_from_stripe(
        self, 
        db: AsyncSession, 
        user_id: str
    ) -> Optional[UsageMetric]:
        """
        Sync billing period from Stripe subscription.
        
        TODO: Integrate with Stripe API to get current_period_start/end
        """
        # Placeholder: would fetch from Stripe in production
        # For now, set period to current month
        quota = await self.get_user_quota(db, user_id)
        
        now = datetime.now(UTC)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
        
        # Update all active metrics for this user
        metrics = await metric_repo.get_by_user(db, user_id)
        for metric in metrics:
            metric.period_start = month_start
            metric.period_end = month_end
            await metric_repo.update(db, metric)
        
        # Return the first one for response (or None if no metrics yet)
        return metrics[0] if metrics else None


# ═════════ LEGACY COMPATIBILITY FUNCTIONS ═════════
# Stub functions for backward compatibility
def _get_user_product_id(user_id: str): 
    return None
def _get_team_usage(team_id: str): 
    return {}
def _get_metric_limit(product_id, metric_name): 
    return None
def _get_metric_usage(team_id, metric): 
    return 0


# Singleton instance
usage_service = UsageMetricService()
