"""
Usage/Credits Pydantic schemas for request/response validation.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ═════════ REQUEST SCHEMAS ═════════


class ConsumeUsageRequest(BaseModel):
    """Request to consume quota for a specific metric."""

    metric: str = Field(
        description="Metric type: slides_generated, images_generated, ai_credits_used, etc."
    )
    amount: int = Field(default=1, ge=1, description="Units to consume")


class TrackUsageRequest(BaseModel):
    """Request to track a usage event."""

    metric: str
    amount: int = Field(default=1, ge=1)
    brand_id: Optional[str] = None


class UpdateQuotaRequest(BaseModel):
    """Request to update usage quotas (admin only)."""

    plan_tier: Optional[str] = None
    slides_limit: Optional[int] = None
    images_limit: Optional[int] = None
    templates_limit: Optional[int] = None
    posts_limit: Optional[int] = None
    ai_credits_limit: Optional[int] = None
    brands_limit: Optional[int] = None


class SyncPeriodRequest(BaseModel):
    """Request to sync usage period from Stripe subscription."""

    pass


# ═════════ RESPONSE SCHEMAS ═════════


class UsageMetricResponse(BaseModel):
    """Response with current usage metrics."""

    id: str
    brand_id: str
    slides_generated: int
    images_generated: int
    templates_created: int
    posts_generated: int
    ai_credits_used: int
    period_start: Optional[datetime]
    period_end: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UsageQuotaResponse(BaseModel):
    """Response with quota limits for current user."""

    id: str
    user_id: str
    slides_limit: Optional[int]
    images_limit: Optional[int]
    templates_limit: Optional[int]
    posts_limit: Optional[int]
    ai_credits_limit: Optional[int]
    brands_limit: Optional[int]
    plan_tier: str
    stripe_product_id: Optional[str]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class QuotaCheckResponse(BaseModel):
    """Response when checking quota against current usage."""

    metric: str
    current_usage: int
    limit: Optional[int]
    remaining: Optional[int]  # None if unlimited
    allowed: bool
    percentage_used: Optional[float]  # 0-100, None if unlimited


class ConsumeResponse(BaseModel):
    """Response after consuming quota."""

    allowed: bool
    consumed: int
    new_total: int
    quota_check: QuotaCheckResponse


class UsageListResponse(BaseModel):
    """Response with multiple usage metrics."""

    items: list[UsageMetricResponse]
    total: int


class UsageSummaryResponse(BaseModel):
    """Summary response showing usage and quotas side-by-side."""

    brand_id: str
    metrics: UsageMetricResponse
    quotas: UsageQuotaResponse
    checks: list[QuotaCheckResponse]  # Per-metric status
    period_active: bool
    period_start: Optional[datetime]
    period_end: Optional[datetime]

    model_config = {"from_attributes": True}
