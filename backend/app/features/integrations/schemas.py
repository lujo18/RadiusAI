"""
Platform Integration Request/Response Schemas - Pydantic DTOs
"""

from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, Literal
from datetime import datetime


class PublishingConfig(BaseModel):
    """Platform-specific publishing configuration"""

    auto_caption: Optional[bool] = True
    hashtag_strategy: Optional[str] = "append"  # append, replace, none
    scheduling_enabled: Optional[bool] = True
    best_time_to_post: Optional[str] = None  # "morning", "afternoon", "evening"

    class Config:
        json_schema_extra = {
            "example": {
                "auto_caption": True,
                "hashtag_strategy": "append",
                "scheduling_enabled": True,
            }
        }

    class PlatformIntegration(BaseModel):
        """Platform integration model used by DB utilities"""

        id: str
        brand_id: str
        user_id: str
        platform: str
        username: str
        platform_account_id: str
        full_name: Optional[str] = None
        profile_picture_url: Optional[str] = None
        bio: Optional[str] = None
        followers_count: Optional[int] = None
        is_business_account: Optional[bool] = False
        status: Optional[str] = "connected"
        last_synced: Optional[datetime] = None

        class Config:
            model_config = {"from_attributes": True}


# ═════════════════════════════════════════════════
#  Inbound DTOs (Request Schemas)
# ═════════════════════════════════════════════════


class InitiateOAuthRequest(BaseModel):
    """Initiate OAuth flow for a platform"""

    platform: Literal["instagram", "tiktok", "youtube", "pinterest", "linkedin"]
    brand_id: str


class CompleteOAuthRequest(BaseModel):
    """Complete OAuth flow with authorization code"""

    platform: Literal["instagram", "tiktok", "youtube", "pinterest", "linkedin"]
    brand_id: str
    auth_code: str
    state: str  # CSRF token validation


class UpdateIntegrationRequest(BaseModel):
    """Update integration settings"""

    publishing_config: Optional[PublishingConfig] = None
    status: Optional[Literal["connected", "disconnected"]] = None


# ═════════════════════════════════════════════════
#  Outbound DTOs (Response Schemas)
# ═════════════════════════════════════════════════


class PlatformIntegrationResponse(BaseModel):
    """Full integration details"""

    id: str
    brand_id: str
    user_id: str

    platform: str
    username: str
    platform_account_id: str

    # Profile info
    full_name: Optional[str]
    profile_picture_url: Optional[str]
    bio: Optional[str]
    website_url: Optional[str]

    # Stats
    followers_count: Optional[int]
    following_count: Optional[int]
    is_business_account: bool

    # Status
    status: str
    last_synced: Optional[datetime]
    error_message: Optional[str]

    # Config
    publishing_config: dict

    # Timestamps
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PlatformIntegrationShortResponse(BaseModel):
    """Minimal integration info for lists"""

    id: str
    platform: str
    username: str
    followers_count: Optional[int]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class OAuthCallbackResponse(BaseModel):
    """Response after OAuth completion"""

    success: bool
    message: str
    integration: Optional[PlatformIntegrationResponse] = None
    oauth_url: Optional[str] = None  # Initial OAuth URL for user to visit


class PublishResponse(BaseModel):
    """Publication result"""

    success: bool
    message: str
    post_url: Optional[str] = None  # Link to published post
    platform_post_id: Optional[str] = None
    published_at: Optional[datetime] = None
    error_details: Optional[str] = None
