# User Models

from pydantic import BaseModel
from typing import Literal, Optional, List
from datetime import datetime

# ==================== USER PROFILE MODELS ====================

class BrandSettings(BaseModel):
    """Account-level brand settings for AI content generation"""
    # Database fields (optional - may come from brand table instead of brand_settings JSON)
    id: Optional[str] = None
    brand_id: Optional[str] = None
    
    # Core brand info (optional with defaults)
    name: Optional[str] = ""
    niche: Optional[str] = ""
    aesthetic: Optional[str] = ""
    target_audience: Optional[str] = ""
    brand_voice: Optional[str] = ""
    content_pillars: Optional[List[str]] = None

    # Voice & style (optional with defaults)
    tone_of_voice: Optional[str] = "casual"
    emoji_usage: Optional[Literal["none", "minimal", "moderate", "heavy"]] = "moderate"
    forbidden_words: Optional[List[str]] = None
    preferred_words: Optional[List[str]] = None

    # Hashtag settings (optional with defaults)
    hashtag_style: Optional[Literal["niche", "trending", "mixed"]] = "mixed"
    hashtag_count: Optional[int] = 10
    hashtags: Optional[List[str]] = None
    
    # Timestamps (optional)
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    
    class Config:
        # Allow extra fields from JSON for flexibility
        extra = "allow"

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