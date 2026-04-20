# PostForMe Analytics Response Models
# Mirrors the PostForMe API /v1/items endpoint response structure

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

# ==================== POSTFORME METRICS ====================


class PostForMeMetrics(BaseModel):
    """Metrics returned by PostForMe API for a post"""

    likes: int = 0
    comments: int = 0
    shares: int = 0
    favorites: int = 0
    reach: Optional[int] = 0
    video_views: Optional[int] = 0
    total_time_watched: Optional[int] = 0
    average_time_watched: Optional[float] = 0
    full_video_watched_rate: Optional[float] = 0
    new_followers: Optional[int] = 0

    class Config:
        extra = "allow"  # Allow additional properties from PostForMe


# ==================== POSTFORME ITEM (POST) ====================


class PostForMeItem(BaseModel):
    """A single post item from PostForMe /v1/items endpoint"""

    platform: str  # e.g., "instagram", "tiktok"
    social_post_result_id: Optional[str] = None
    posted_at: datetime  # When the post was published
    social_post_id: Optional[str] = None
    external_post_id: Optional[str] = None
    platform_post_id: str  # The platform's native post ID
    social_account_id: str  # PostForMe's account ID
    external_account_id: Optional[str] = None
    platform_account_id: str  # Platform's account ID
    platform_url: str  # Direct link to the post on platform
    caption: str  # Post caption/text
    media: List[Dict[str, Any]] = []  # Media objects
    metrics: Optional[PostForMeMetrics] = None

    class Config:
        extra = "allow"


# ==================== POSTFORME PAGINATED RESPONSE ====================


class PostForMePaginationMeta(BaseModel):
    """Pagination metadata from PostForMe API"""

    cursor: Optional[str] = None
    limit: int
    next: Optional[str] = None
    has_more: bool = False


class PostForMeAnalyticsResponse(BaseModel):
    """Full response from PostForMe /v1/items endpoint with expand=["metrics"]"""

    data: List[PostForMeItem] = []
    meta: PostForMePaginationMeta
