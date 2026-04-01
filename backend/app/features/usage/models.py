"""
Usage/Credits ORM Models for quota tracking and rate limiting.

Tracks usage metrics per brand/team:
- slides_generated: Number of slides created via AI
- images_generated: Number of images generated
- templates_created: Number of custom templates created
- brands_created: Number of brands created
- posts_generated: Number of posts generated
- ai_credits_used: AI credits consumed
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import (
    String,
    Integer,
    Float,
    DateTime,
    JSON,
    ForeignKey,
    Index,
    Boolean,
)
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class UsageMetric(Base):
    """
    Tracks usage metrics per brand/team for quota enforcement.

    Metrics are aggregated per billing period based on subscription tier.
    """

    __tablename__ = "usage_metrics"

    # Primary Key & Foreign Keys
    id: Mapped[str] = mapped_column(String(50), primary_key=True)  # usg_{uuid}
    brand_id: Mapped[str] = mapped_column(
        String(50), ForeignKey("brands.id"), nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id"), nullable=False
    )

    # Tracking metrics
    slides_generated: Mapped[int] = mapped_column(Integer, default=0)
    images_generated: Mapped[int] = mapped_column(Integer, default=0)
    templates_created: Mapped[int] = mapped_column(Integer, default=0)
    posts_generated: Mapped[int] = mapped_column(Integer, default=0)
    ai_credits_used: Mapped[int] = mapped_column(Integer, default=0)

    # Billing period
    period_start: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    period_end: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Metadata
    usage_metadata: Mapped[Optional[dict]] = mapped_column(
        JSON, nullable=True
    )  # Additional tracking data

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.utcnow()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.utcnow(), onupdate=lambda: datetime.utcnow()
    )

    # Indexes for common queries
    __table_args__ = (
        Index("ix_usage_brand_id", "brand_id"),
        Index("ix_usage_user_id", "user_id"),
        Index("ix_usage_period", "period_start", "period_end"),
        Index("ix_usage_brand_period", "brand_id", "period_start"),
    )


class UsageQuota(Base):
    """
    Quota limits per subscription tier/plan.

    Defines the maximum allowed usage for each metric based on the user's subscription.
    """

    __tablename__ = "usage_quotas"

    # Primary Key & Foreign Keys
    id: Mapped[str] = mapped_column(String(50), primary_key=True)  # quo_{uuid}
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id"), nullable=False, unique=True
    )

    # Quota limits per metric
    slides_limit: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True
    )  # None = unlimited
    images_limit: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    templates_limit: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    posts_limit: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    ai_credits_limit: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    brands_limit: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Plan reference
    stripe_product_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    stripe_subscription_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    plan_tier: Mapped[str] = mapped_column(
        String(50), default="free"
    )  # free, pro, agency

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.utcnow()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.utcnow(), onupdate=lambda: datetime.utcnow()
    )

    # Indexes
    __table_args__ = (
        Index("ix_quota_user_id", "user_id"),
        Index("ix_quota_plan_tier", "plan_tier"),
    )
