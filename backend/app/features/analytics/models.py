"""
Analytics ORM Models for post performance tracking
"""

from datetime import datetime
from sqlalchemy import String, Integer, Float, DateTime, JSON, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional

from app.core.database import Base


class PostAnalytic(Base):
    """
    Post analytics snapshot tracking performance metrics.

    Records impressions, engagement, reach, etc. at point-in-time intervals.
    """

    __tablename__ = "post_analytics"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    post_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("posts.id"), nullable=False, index=True
    )
    template_id: Mapped[str] = mapped_column(String(255), nullable=False)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id"), nullable=False
    )
    team_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)

    # Platform
    platform: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # instagram, tiktok

    # Metrics snapshot
    impressions: Mapped[int] = mapped_column(Integer, default=0)
    reach: Mapped[int] = mapped_column(Integer, default=0)
    engagement: Mapped[int] = mapped_column(Integer, default=0)
    engagement_rate: Mapped[float] = mapped_column(Float, default=0.0)
    saves: Mapped[int] = mapped_column(Integer, default=0)
    shares: Mapped[int] = mapped_column(Integer, default=0)
    comments: Mapped[int] = mapped_column(Integer, default=0)
    profile_visits: Mapped[int] = mapped_column(Integer, default=0)
    click_through_rate: Mapped[float] = mapped_column(Float, default=0.0)

    # A/B Testing
    variant_set_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Metadata
    meta_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Timestamps
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    __table_args__ = (
        Index("ix_analytics_post_id", "post_id"),
        Index("ix_analytics_team_id", "team_id"),
        Index("ix_analytics_platform", "platform"),
        Index("ix_analytics_recorded_at", "recorded_at"),
    )


class PostPerformanceSummary(Base):
    """
    Aggregated post performance over time.

    Summary metrics for quick performance queries.
    """

    __tablename__ = "post_performance_summary"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    post_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("posts.id"), nullable=False, unique=True
    )
    team_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)

    # Aggregate metrics
    total_impressions: Mapped[int] = mapped_column(Integer, default=0)
    total_reach: Mapped[int] = mapped_column(Integer, default=0)
    total_engagement: Mapped[int] = mapped_column(Integer, default=0)
    avg_engagement_rate: Mapped[float] = mapped_column(Float, default=0.0)

    # Performance rank
    performance_score: Mapped[float] = mapped_column(Float, default=0.0)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    last_synced_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    __table_args__ = (
        Index("ix_post_perf_summary_post_id", "post_id"),
        Index("ix_post_perf_summary_team_id", "team_id"),
    )
