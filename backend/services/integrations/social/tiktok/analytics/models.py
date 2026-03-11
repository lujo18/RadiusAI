"""
TikTok analytics response models.

Mirrors the TikTok Video List API (/v2/video/list/) and
Video Query API (/v2/video/query/) response structures.

TikTok metric field reference:
https://developers.tiktok.com/doc/video-api-list#fields
"""

from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
from datetime import datetime


# ---------------------------------------------------------------------------
# Core metrics
# ---------------------------------------------------------------------------


class TikTokVideoMetrics(BaseModel):
    """
    Engagement metrics available via /v2/video/query/ with stats fields.
    All fields are optional – TikTok may omit zero-value or unavailable fields.
    """

    # Engagement
    like_count: Optional[int] = 0
    comment_count: Optional[int] = 0
    share_count: Optional[int] = 0
    view_count: Optional[int] = 0
    # TikTok-specific
    play_count: Optional[int] = 0  # total plays (counts replays)
    average_time_watched: Optional[float] = 0.0  # seconds
    total_time_watched: Optional[float] = 0.0  # seconds
    full_video_watched_rate: Optional[float] = 0.0  # 0–1 fraction
    reach: Optional[int] = 0  # unique accounts reached
    # Carousel-specific (photos)
    forward_count: Optional[int] = 0  # next-slide swipes
    backward_count: Optional[int] = 0  # prev-slide swipes

    class Config:
        extra = "allow"  # tolerate undocumented TikTok fields


# ---------------------------------------------------------------------------
# Video item
# ---------------------------------------------------------------------------


class TikTokVideoItem(BaseModel):
    """
    A single video / photo-carousel item returned by TikTok's video list/query endpoints.
    """

    id: str  # TikTok's native video/post ID
    title: Optional[str] = None
    video_description: Optional[str] = None
    create_time: Optional[int] = None  # Unix timestamp
    cover_image_url: Optional[str] = None
    share_url: Optional[str] = None
    embed_link: Optional[str] = None
    duration: Optional[int] = None  # seconds (0 for photos)

    # Stats – populated when you request stats fields in the API call
    like_count: Optional[int] = 0
    comment_count: Optional[int] = 0
    share_count: Optional[int] = 0
    view_count: Optional[int] = 0

    # Richer metrics (from /v2/video/query/ with expanded stats)
    metrics: Optional[TikTokVideoMetrics] = None

    @property
    def created_at(self) -> Optional[datetime]:
        """Convert Unix create_time to a datetime for convenience."""
        if self.create_time:
            return datetime.utcfromtimestamp(self.create_time)
        return None

    class Config:
        extra = "allow"


# ---------------------------------------------------------------------------
# Paginated list response
# ---------------------------------------------------------------------------


class TikTokCursor(BaseModel):
    cursor: Optional[int] = None
    has_more: bool = False


class TikTokVideoListData(BaseModel):
    videos: List[TikTokVideoItem] = Field(default_factory=list)
    cursor: Optional[int] = None
    has_more: bool = False


class TikTokVideoListResponse(BaseModel):
    """
    Full response from /v2/video/list/ or /v2/video/query/.
    """

    data: TikTokVideoListData = Field(default_factory=TikTokVideoListData)
    error: Optional[Dict[str, Any]] = None

    class Config:
        extra = "allow"


# ---------------------------------------------------------------------------
# Normalised analytics (provider-agnostic shape, mirrors PostForMe analytics)
# ---------------------------------------------------------------------------


class TikTokPostAnalytics(BaseModel):
    """
    Normalised analytics record written to Supabase post_analytics table.
    Shape is intentionally close to PostForMeAnalyticsResponse for easy substitution.
    """

    platform_post_id: str  # TikTok's native video ID
    platform: str = "tiktok"
    posted_at: Optional[datetime] = None
    share_url: Optional[str] = None

    # Core engagement
    like_count: int = 0
    comment_count: int = 0
    share_count: int = 0
    view_count: int = 0

    # Extended
    play_count: int = 0
    average_time_watched: float = 0.0
    total_time_watched: float = 0.0
    full_video_watched_rate: float = 0.0
    reach: int = 0

    class Config:
        extra = "allow"
