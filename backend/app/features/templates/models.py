"""
Template ORM Model - SQLAlchemy representation of content templates
"""

from sqlalchemy import String, JSON, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
import uuid

from app.core.database import Base


class Template(Base):
    """
    Content template defining slide structure, design, and content rules for posts.

    Each template belongs to a brand (user-scoped via brand).
    Templates define:
    - Slide sequence and design (visual structure)
    - Content rules (tone, depth, format constraints)
    - Brand-specific styling and configuration
    """

    __tablename__ = "templates"

    # Primary Key
    id: Mapped[str] = mapped_column(String(50), primary_key=True)

    # Relationships
    brand_id: Mapped[str] = mapped_column(
        String(50), ForeignKey("brands.id"), nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id"), nullable=False
    )

    # Template metadata
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    category: Mapped[str] = mapped_column(String(50), default="custom")
    status: Mapped[str] = mapped_column(
        String(20), default="active"
    )  # active, archived, draft

    # Template configuration (stored as JSON)
    style_config: Mapped[dict | None] = mapped_column(
        JSON, nullable=True
    )  # Slide designs, layouts
    content_rules: Mapped[dict | None] = mapped_column(
        JSON, nullable=True
    )  # Tone, depth, format

    # Template settings
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    favorite: Mapped[bool] = mapped_column(Boolean, default=False)
    parent_id: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )  # For template inheritance

    # Metadata
    tags: Mapped[list[str] | None] = mapped_column(
        JSON, nullable=True
    )  # Search/organization
    performance_metrics: Mapped[dict] = mapped_column(
        JSON, default={}
    )  # Cached analytics

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    last_used: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Index for common queries
    __table_args__ = (
        Index("ix_templates_brand_id", "brand_id"),
        Index("ix_templates_user_id", "user_id"),
        Index("ix_templates_status", "status"),
        Index("ix_templates_is_default", "is_default"),
    )

    def __init__(self, **kwargs):
        """Generate ID if not provided"""
        if "id" not in kwargs:
            kwargs["id"] = f"tmpl_{uuid.uuid4().hex[:12]}"
        super().__init__(**kwargs)
