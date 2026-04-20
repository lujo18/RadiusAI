from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List, Literal


# ── Inbound (requests) ──────────────────────
class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    email: EmailStr | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ── Outbound (responses) ────────────────────
class UserResponse(BaseModel):
    id: int
    email: str
    is_active: bool
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ═════════════════════════════════════════════════
#  BrandSettings - Legacy Pydantic Model
#  Account-level brand settings for AI content generation
# ═════════════════════════════════════════════════


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
    reading_level: Optional[str] = None  # "7th grade", "conversational", "expert", etc.
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


class UpdateProfileRequest(BaseModel):
    """Request to update user profile"""

    name: Optional[str] = None
    brand_settings: Optional[BrandSettings] = None
