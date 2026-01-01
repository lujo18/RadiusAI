# Analytics Models

from pydantic import BaseModel
from typing import Literal
from datetime import datetime

# ==================== ANALYTICS SUB-MODELS ====================

class PostMetrics(BaseModel):
    impressions: int = 0
    reach: int = 0
    engagement: int = 0
    engagementRate: float = 0.0
    saves: int = 0
    shares: int = 0
    comments: int = 0
    profileVisits: int = 0
    clickThroughRate: float = 0.0

# ==================== ANALYTICS MODELS ====================

class Analytics(BaseModel):
    id: str
    post_id: str
    template_id: str
    user_id: str
    platform: str  # Supabase: string
    date: str  # Supabase: string (ISO)
    metrics: dict  # Supabase: JSON
    variant_set_id: Optional[str] = None

class TrackAnalyticsRequest(BaseModel):
    postId: str
    templateId: str
    platform: Literal["instagram", "tiktok"]
    metrics: PostMetrics
    variantSetId: str | None = None
