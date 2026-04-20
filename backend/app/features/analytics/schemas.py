"""
Analytics Pydantic schemas for request/response DTOs
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from typing import List, Dict, Any


# PostForMe compatibility models (copied minimal structure)
from pydantic import Field


class PostForMeMetrics(BaseModel):
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
        extra = "allow"


class PostForMeItem(BaseModel):
    platform: str
    social_post_result_id: Optional[str] = None
    posted_at: datetime
    social_post_id: Optional[str] = None
    external_post_id: Optional[str] = None
    platform_post_id: str
    social_account_id: str
    external_account_id: Optional[str] = None
    platform_account_id: str
    platform_url: str
    caption: str
    media: List[Dict[str, Any]] = []
    metrics: Optional[PostForMeMetrics] = None

    class Config:
        extra = "allow"


class PostForMePaginationMeta(BaseModel):
    cursor: Optional[str] = None
    limit: int
    next: Optional[str] = None
    has_more: bool = False


class PostForMeAnalyticsResponse(BaseModel):
    data: List[PostForMeItem] = []
    meta: PostForMePaginationMeta


class PostMetrics(BaseModel):
    """Post performance metrics"""

    impressions: int = Field(default=0, ge=0)
    reach: int = Field(default=0, ge=0)
    engagement: int = Field(default=0, ge=0)
    engagement_rate: float = Field(default=0.0, ge=0.0, le=100.0)
    saves: int = Field(default=0, ge=0)
    shares: int = Field(default=0, ge=0)
    comments: int = Field(default=0, ge=0)
    profile_visits: int = Field(default=0, ge=0)
    click_through_rate: float = Field(default=0.0, ge=0.0, le=100.0)


class TrackAnalyticsRequest(BaseModel):
    """Request to track post analytics"""

    post_id: str
    template_id: str
    platform: Literal["instagram", "tiktok"]
    metrics: PostMetrics
    variant_set_id: Optional[str] = None


class PostAnalyticResponse(BaseModel):
    """Analytics snapshot response"""

    id: str
    post_id: str
    template_id: str
    user_id: str
    team_id: str
    platform: str
    metrics: PostMetrics
    variant_set_id: Optional[str]
    recorded_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PostPerformanceResponse(BaseModel):
    """Post performance summary response"""

    post_id: str
    total_impressions: int
    total_reach: int
    total_engagement: int
    avg_engagement_rate: float
    performance_score: float
    last_synced_at: Optional[datetime]


class AnalyticsQueryRequest(BaseModel):
    """Query analytics data"""

    post_id: Optional[str] = None
    template_id: Optional[str] = None
    platform: Optional[str] = None
    variant_set_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    limit: int = Field(default=100, le=1000)
    offset: int = Field(default=0, ge=0)


class AnalyticsAggregateResponse(BaseModel):
    """Aggregated analytics for multiple posts"""

    total_posts: int
    total_impressions: int
    avg_engagement_rate: float
    platform_breakdown: dict
    top_performing: list[PostPerformanceResponse]
    trend: str = "stable"  # "up", "down", "stable"

 
# Backwards compatibility: some legacy modules expect `PostAnalyticsRecord`.
# Provide a thin alias to the modern schema to avoid import errors during
# migration.
PostAnalyticsRecord = PostAnalyticResponse
