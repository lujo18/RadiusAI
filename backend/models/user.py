# User Models

from pydantic import BaseModel
from typing import Literal, Optional, List
from datetime import datetime

# ==================== USER PROFILE MODELS ====================

class BrandSettings(BaseModel):
    """Account-level brand settings for AI content generation"""
    niche: str
    aesthetic: str
    targetAudience: str
    brandVoice: str
    contentPillars: List[str]
    
    toneOfVoice: Optional[Literal["professional", "casual", "humorous", "edgy", "inspirational"]] = None
    emojiUsage: Optional[Literal["none", "minimal", "moderate", "heavy"]] = None
    forbiddenWords: Optional[List[str]] = None
    preferredWords: Optional[List[str]] = None
    
    hashtagStyle: Optional[Literal["niche", "trending", "mixed"]] = None
    hashtagCount: Optional[int] = None
    hashtags: Optional[List[str]] = None

class UserProfile(BaseModel):
    """User account information"""
    id: str
    email: str
    name: str
    plan: str = "free"  # free, pro, enterprise
    defaultTemplateId: Optional[str] = None
    brandSettings: BrandSettings
    createdAt: datetime
    updatedAt: datetime

class UpdateProfileRequest(BaseModel):
    """Request to update user profile"""
    name: Optional[str] = None
    brandSettings: Optional[BrandSettings] = None
