"""
Post ORM Model - SQLAlchemy representation of generated social media posts
"""

from sqlalchemy import String, DateTime, ForeignKey, Index, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from enum import Enum
import uuid

from app.core.database import Base


class PostStatus(str, Enum):
    """Post lifecycle status"""

    DRAFT = "draft"
    SCHEDULED = "scheduled"
    POSTED = "posted"
    # Backward-compatibility for rows written before enum normalization.
    POSTING = "posting"
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
    - Rendering info (storage URLs for slide images)
    - Publishing metadata (platform, scheduled time, external IDs)
    - Variant information (A/B testing)
    """

    __tablename__ = "posts"

    # Primary Key
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)

    # Relationships
    brand_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("brands.id"), nullable=False
    )
    template_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("templates.id"), nullable=False
    )
    variant_set_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False), nullable=True
    )  # For A/B testing

    # Post metadata
    platform: Mapped[str] = mapped_column(String, default=PostPlatform.INSTAGRAM.value)
    status: Mapped[str] = mapped_column(
        SQLEnum(
            PostStatus,
            name="post_status",
            values_callable=lambda enum: [e.value for e in enum],
            create_type=False,
        ),
        default=PostStatus.DRAFT.value,
    )

    # Post content (stored as JSON)
    content: Mapped[dict] = mapped_column(JSONB, nullable=False)  # PostContent structure

    # Storage URLs (after rendering)
    storage_urls: Mapped[dict] = mapped_column(
        JSONB, default={}
    )  # Slides + thumbnail URLs

    # Publishing metadata
    scheduled_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    published_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    post_metadata: Mapped[dict] = mapped_column(
        "metadata", JSONB, default={}
    )  # Variant label, generation params

    # External publishing/state metadata
    platform_ids: Mapped[list[str] | None] = mapped_column(
        ARRAY(UUID(as_uuid=False)), nullable=True
    )
    external_post_id: Mapped[str | None] = mapped_column(String, nullable=True)
    external_permalink: Mapped[str | None] = mapped_column(String, nullable=True)
    error_message: Mapped[str | None] = mapped_column(String, nullable=True)
    analytics_last_sync: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    generation_prompt: Mapped[str | None] = mapped_column(String, nullable=True)
    platform_captions: Mapped[dict] = mapped_column(JSONB, default={})
    automation_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
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
            kwargs["id"] = str(uuid.uuid4())
        super().__init__(**kwargs)

    @property
    def analytics(self) -> dict:
        """Compatibility shim for older API response schemas."""
        return {}
