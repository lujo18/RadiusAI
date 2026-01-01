# User Models

from pydantic import BaseModel
from typing import Literal, Optional, List
from datetime import datetime

# ==================== USER PROFILE MODELS ====================

class BrandSettings(BaseModel):
    """Account-level brand settings for AI content generation"""
    niche: str
    aesthetic: str
    target_audience: str
    brand_voice: str
    content_pillars: List[str]

    tone_of_voice: Optional[Literal["professional", "casual", "humorous", "edgy", "inspirational"]] = None
    emoji_usage: Optional[Literal["none", "minimal", "moderate", "heavy"]] = None
    forbidden_words: Optional[List[str]] = None
    preferred_words: Optional[List[str]] = None

    hashtag_style: Optional[Literal["niche", "trending", "mixed"]] = None
    hashtag_count: Optional[int] = None
    hashtags: Optional[List[str]] = None

class User(BaseModel):
    """User account information"""
    id: str
    email: str
    name: str
    plan: str = "free"  # free, pro, enterprise
    default_template_id: Optional[str] = None
    brand_settings: dict  # Supabase: JSON
    created_at: str  # Supabase: string (ISO)
    updated_at: str  # Supabase: string (ISO)
class UpdateProfileRequest(BaseModel):
    """Request to update user profile"""
    name: Optional[str] = None
    brand_settings: Optional[BrandSettings] = None