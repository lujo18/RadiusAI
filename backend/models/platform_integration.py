from pydantic import BaseModel
from typing import Optional
from enum import Enum


class IntegrationStatus(str, Enum):
    connected = "connected"
    disconnected = "disconnected"


class PlatformIntegration(BaseModel):
    """Model matching the `platform_integrations` table in Supabase.

    Timestamps are kept as `str` because the frontend type uses ISO strings.
    """

    id: str
    brand_id: str
    platform: str
    username: str

    bio: Optional[str] = None
    full_name: Optional[str] = None
    profile_picture_url: Optional[str] = None
    website_url: Optional[str] = None

    followers_count: Optional[int] = None
    following_count: Optional[int] = None
    is_business_account: Optional[bool] = None

    # PostForMe integration
    pfm_account_id: Optional[str] = None

    # TikTok direct OAuth fields
    tiktok_open_id: Optional[str] = None
    tiktok_access_token: Optional[str] = None
    tiktok_refresh_token: Optional[str] = None
    tiktok_token_expires_at: Optional[str] = None
    tiktok_refresh_expires_at: Optional[str] = None

    status: IntegrationStatus

    user_id: Optional[str] = None

    created_at: str
    updated_at: str
