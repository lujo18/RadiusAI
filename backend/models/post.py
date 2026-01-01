# Post Models

from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime
from .gemini import GeminiCarouselResponse

# ==================== POST SUB-MODELS ====================

class StorageUrls(BaseModel):
    slides: List[str] = []  # URLs to slide images in Supabase Storage
    thumbnail: Optional[str] = None  # URL to thumbnail image

class PostAnalytics(BaseModel):
    impressions: int = 0
    engagement: int = 0
    saves: int = 0
    shares: int = 0
    engagementRate: float = 0.0
    lastUpdated: Optional[datetime] = None

class PostMetadata(BaseModel):
    variantLabel: Optional[str] = None
    generationParams: dict = {}

# ==================== POST MODELS ====================

class Post(BaseModel):
    id: str
    user_id: str
    template_id: str
    variant_set_id: Optional[str] = None
    platform: str  # Supabase: string
    status: str  # Supabase: string
    created_at: str  # Supabase: string (ISO)
    updated_at: Optional[str] = None
    scheduled_time: Optional[str] = None
    published_time: Optional[str] = None
    content: dict  # Supabase: JSON
    storage_urls: dict = {}
    metadata: dict = {}

class CreatePostRequest(BaseModel):
    templateId: str
    platform: Literal["instagram", "tiktok"]
    content: GeminiCarouselResponse
    scheduledTime: Optional[datetime] = None
    variantSetId: Optional[str] = None

class UpdatePostRequest(BaseModel):
    status: Optional[Literal["draft", "scheduled", "published", "failed"]] = None
    scheduledTime: Optional[datetime] = None
    content: Optional[GeminiCarouselResponse] = None
