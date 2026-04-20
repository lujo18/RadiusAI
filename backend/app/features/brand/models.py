"""
Brand ORM model - represents a brand owned by a user
"""

from sqlalchemy import String, Integer, JSON, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, UTC
from app.core.database import Base


class Brand(Base):
    """Represents a brand profile for content creation"""

    __tablename__ = "brands"

    id: Mapped[str] = mapped_column(String(255), primary_key=True)
    user_id: Mapped[str] = mapped_column(
        String(255), index=True
    )  # References Supabase auth user
    team_id: Mapped[str] = mapped_column(String(255), nullable=True, index=True)

    name: Mapped[str] = mapped_column(String(255), nullable=True)
    description: Mapped[str] = mapped_column(String(1000), nullable=True)

    # Brand configuration stored as JSON
    brand_settings: Mapped[dict] = mapped_column(JSON, default={})
    cta_settings: Mapped[dict] = mapped_column(JSON, nullable=True)

    # Counters for quick stats
    post_count: Mapped[int] = mapped_column(Integer, default=0)
    template_count: Mapped[int] = mapped_column(Integer, default=0)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(UTC), index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC)
    )
