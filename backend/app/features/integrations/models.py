"""
Platform Integration ORM Model - OAuth linked social accounts
"""

from sqlalchemy import String, JSON, Boolean, DateTime, ForeignKey, Index, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from enum import Enum
import uuid

from app.core.database import Base


class IntegrationStatus(str, Enum):
    """Integration connection status"""
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    EXPIRED = "expired"
    FAILED = "failed"


class SocialPlatform(str, Enum):
    """Supported social media platforms"""
    INSTAGRAM = "instagram"
    TIKTOK = "tiktok"
    YOUTUBE = "youtube"
    PINTEREST = "pinterest"
    LINKEDIN = "linkedin"


class PlatformIntegration(Base):
    """
    OAuth-linked social media account.
    
    Stores:
    - Account credentials and profile info (username, followers, bio, etc.)
    - OAuth tokens (with refresh token rotation)
    - Publishing configuration
    - Connection status and metadata
    """
    
    __tablename__ = "platform_integrations"
    
    # Primary Key
    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    
    # Relationships
    brand_id: Mapped[str] = mapped_column(String(50), ForeignKey("brands.id"), nullable=False)
    user_id: Mapped[str] = mapped_column(String(255), ForeignKey("users.id"), nullable=False)
    
    # Platform and account info
    platform: Mapped[str] = mapped_column(String(20), nullable=False)  # instagram, tiktok, youtube, etc.
    username: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Profile metadata
    profile_picture_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    bio: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    website_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    # Account stats (cached)
    followers_count: Mapped[int | None] = mapped_column(default=0)
    following_count: Mapped[int | None] = mapped_column(default=0)
    is_business_account: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # OAuth tokens (encrypted in production)
    # Note: In production, these should be encrypted at rest via Supabase Encryption
    access_token: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    refresh_token: Mapped[str | None] = mapped_column(String(500), nullable=True)
    token_expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Platform-specific account IDs
    platform_account_id: Mapped[str] = mapped_column(String(100), nullable=False)  # Instagram ID, TikTok ID, etc.
    
    # Status and publishing config
    status: Mapped[str] = mapped_column(String(20), default=IntegrationStatus.CONNECTED.value)
    
    # Publishing settings (stored as JSON)
    publishing_config: Mapped[dict] = mapped_column(JSON, default={})  # Schedule, hashtags, captions, etc.
    
    # Metadata
    last_synced: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    error_message: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index("ix_platform_integrations_brand_id", "brand_id"),
        Index("ix_platform_integrations_user_id", "user_id"),
        Index("ix_platform_integrations_platform", "platform"),
        Index("ix_platform_integrations_status", "status"),
        Index("ix_platform_integrations_brand_platform", "brand_id", "platform"),
    )
    
    def __init__(self, **kwargs):
        """Generate ID if not provided"""
        if "id" not in kwargs:
            kwargs["id"] = f"integ_{uuid.uuid4().hex[:12]}"
        super().__init__(**kwargs)
