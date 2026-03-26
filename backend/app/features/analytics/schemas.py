"""
Analytics Pydantic schemas for request/response DTOs
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


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
