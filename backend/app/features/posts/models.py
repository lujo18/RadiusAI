"""
Post ORM Model - SQLAlchemy representation of generated social media posts
"""

from sqlalchemy import String, JSON, DateTime, ForeignKey, Index, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from enum import Enum
import uuid

from app.core.database import Base


class PostStatus(str, Enum):
    """Post lifecycle status"""

    DRAFT = "draft"
    SCHEDULED = "scheduled"
    POSTED = "posted"
    FAILED = "failed"
    ARCHIVED = "archived"


class PostPlatform(str, Enum):
    """Social media platforms"""

    INSTAGRAM = "instagram"
    TIKTOK = "tiktok"
    REELS = "reels"
    YOUTUBE_SHORTS = "youtube_shorts"


class Post(Base):
    """
    Generated social media post/carousel.

    Contains:
    - Generated content (slides, caption, hashtags)
    - Rendering status (storage URLs for slide images)
    - Publishing metadata (platform, scheduled time, analytics)
    - Variant information (A/B testing)
    """

    __tablename__ = "posts"

    # Primary Key
    id: Mapped[str] = mapped_column(String(50), primary_key=True)

    # Relationships
    brand_id: Mapped[str] = mapped_column(
        String(50), ForeignKey("brands.id"), nullable=False
    )
    template_id: Mapped[str] = mapped_column(
        String(50), ForeignKey("templates.id"), nullable=False
    )
    variant_set_id: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )  # For A/B testing

    # Post metadata
    platform: Mapped[str] = mapped_column(
        String(20), default=PostPlatform.INSTAGRAM.value
    )
    status: Mapped[str] = mapped_column(String(20), default=PostStatus.DRAFT.value)

    # Post content (stored as JSON)
    content: Mapped[dict] = mapped_column(JSON, nullable=False)  # PostContent structure

    # Storage URLs (after rendering)
    storage_urls: Mapped[dict] = mapped_column(
        JSON, default={}
    )  # Slides + thumbnail URLs
    rendering_status: Mapped[str] = mapped_column(
        String(20), default="pending"
    )  # pending, in_progress, complete, failed

    # Publishing metadata
    scheduled_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    published_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    post_metadata: Mapped[dict] = mapped_column(
        JSON, default={}
    )  # Variant label, generation params

    # Analytics (cached from Supabase)
    analytics: Mapped[dict] = mapped_column(
        JSON, default={}
    )  # impressions, engagement, saves, shares

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Indexes for common queries
    __table_args__ = (
        Index("ix_posts_brand_id", "brand_id"),
        Index("ix_posts_template_id", "template_id"),
        Index("ix_posts_status", "status"),
        Index("ix_posts_platform", "platform"),
        Index("ix_posts_scheduled_time", "scheduled_time"),
        Index("ix_posts_variant_set_id", "variant_set_id"),
    )

    def __init__(self, **kwargs):
        """Generate ID if not provided"""
        if "id" not in kwargs:
            kwargs["id"] = f"post_{uuid.uuid4().hex[:12]}"
        super().__init__(**kwargs)
