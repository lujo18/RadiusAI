"""
Variants ORM Models for A/B testing different templates
"""

from datetime import datetime
from sqlalchemy import String, Integer, DateTime, JSON, ForeignKey, Index, Boolean, Float
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional

from app.core.database import Base


class VariantSet(Base):
    """
    A/B test variant set - compares templates' performance.
    
    Tracks which templates are being tested and their results.
    """
    
    __tablename__ = "variant_sets"
    
    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    team_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(255), ForeignKey("users.id"), nullable=False)
    
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    
    # Templates in test (stored as JSON array)
    templates: Mapped[list] = mapped_column(JSON, nullable=False)  # ["template_id_1", "template_id_2"]
    
    # Test configuration
    posts_per_template: Mapped[int] = mapped_column(Integer, default=5)
    total_duration_days: Mapped[int] = mapped_column(Integer, default=7)
    
    # Status & Dates
    status: Mapped[str] = mapped_column(String(50), default="active")  # active, paused, completed
    start_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    end_date: Mapped[DateTime] = mapped_column(DateTime, nullable=True)
    
    # Results (populated when completed)
    results: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Metadata
    meta_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    __table_args__ = (
        Index("ix_variant_set_team_id", "team_id"),
        Index("ix_variant_set_user_id", "user_id"),
        Index("ix_variant_set_status", "status"),
    )


class VariantPerfornance(Base):
    """
    Track individual variant performance metrics.
    
    Aggregates performance for each template in a variant set.
    """
    
    __tablename__ = "variant_performance"
    
    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    variant_set_id: Mapped[str] = mapped_column(String(50), ForeignKey("variant_sets.id"), nullable=False, index=True)
    template_id: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Metrics
    total_posts: Mapped[int] = mapped_column(Integer, default=0)
    avg_impressions: Mapped[float] = mapped_column(Float, default=0.0)
    avg_reach: Mapped[float] = mapped_column(Float, default=0.0)
    avg_engagement: Mapped[float] = mapped_column(Float, default=0.0)
    avg_engagement_rate: Mapped[float] = mapped_column(Float, default=0.0)
    
    # Performance scores
    overall_score: Mapped[float] = mapped_column(Float, default=0.0)
    confidence_score: Mapped[float] = mapped_column(Float, default=0.0)  # Statistical confidence
    
    # Status
    is_winning: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    
    __table_args__ = (
        Index("ix_variant_perf_variant_set_id", "variant_set_id"),
        Index("ix_variant_perf_template_id", "template_id"),
    )
