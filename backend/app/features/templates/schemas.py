"""
Template Request/Response Schemas - Pydantic DTOs for template operations
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class StyleConfig(BaseModel):
    """Template visual configuration (slide designs, layouts)"""
    slide_count: int = Field(ge=1, le=20)
    aspect_ratio: str = "9:16"  # TikTok/Reels standard
    slide_designs: List[dict] = []  # Slide design objects
    slide_sequence: List[dict] = []  # Slide order
    
    class Config:
        json_schema_extra = {
            "example": {
                "slide_count": 5,
                "aspect_ratio": "9:16",
                "slide_designs": [
                    {"id": "hook", "name": "Hook Slide", "dynamic": True}
                ],
                "slide_sequence": [
                    {"slide_number": 1, "design_id": "hook"}
                ]
            }
        }


class ContentRules(BaseModel):
    """Template content constraints and guidelines"""
    format: str = "listicle"  # listicle, narrative, tips, etc.
    perspective: str = "second_person"  # How content is written
    depth_level: str = "detailed"  # surface, detailed, comprehensive
    topic_focus: Optional[str] = None
    hook_style: str = "question"  # question, statistic, benefit, etc.
    body_style: str = "explanatory"
    cta_style: str = "action"
    include_examples: bool = True
    include_statistics: bool = True
    personal_story: bool = False
    avoid_topics: Optional[List[str]] = None
    must_include: Optional[List[str]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "format": "listicle",
                "perspective": "second_person",
                "depth_level": "detailed",
                "hook_style": "question"
            }
        }


# ═════════════════════════════════════════════════
#  Inbound DTOs (Request Schemas)
# ═════════════════════════════════════════════════

class TemplateCreate(BaseModel):
    """Create a new template"""
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    category: Optional[str] = Field("custom", max_length=50)
    
    # Configuration
    style_config: Optional[dict] = None
    content_rules: Optional[dict] = None
    
    # Settings
    is_default: Optional[bool] = False
    parent_id: Optional[str] = None  # For template inheritance
    tags: Optional[List[str]] = None


class TemplateUpdate(BaseModel):
    """Update template - all fields optional"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    category: Optional[str] = Field(None, max_length=50)
    
    # Configuration
    style_config: Optional[dict] = None
    content_rules: Optional[dict] = None
    
    # Settings
    is_default: Optional[bool] = None
    favorite: Optional[bool] = None
    tags: Optional[List[str]] = None


# ═════════════════════════════════════════════════
#  Outbound DTOs (Response Schemas)
# ═════════════════════════════════════════════════

class TemplateResponse(BaseModel):
    """Full template details"""
    id: str
    name: str
    description: Optional[str]
    category: str
    status: str
    
    brand_id: str
    user_id: str
    
    style_config: Optional[dict]
    content_rules: Optional[dict]
    
    is_default: bool
    favorite: bool
    parent_id: Optional[str]
    
    tags: Optional[List[str]]
    performance_metrics: dict
    
    created_at: datetime
    updated_at: datetime
    last_used: Optional[datetime]
    
    model_config = {"from_attributes": True}


class TemplateListResponse(BaseModel):
    """Minimal template info for list views"""
    id: str
    name: str
    description: Optional[str]
    category: str
    status: str
    
    is_default: bool
    favorite: bool
    
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


# ═════════════════════════════════════════════════
#  Legacy Pydantic Data Models (for backward compatibility)
#  These represent template data from the database
# ═════════════════════════════════════════════════

class LayoutConfig(BaseModel):
    """Template layout configuration"""
    slide_count: int = Field(ge=3, le=10)
    aspect_ratio: str = "9:16"


class TemplatePerformance(BaseModel):
    """Template performance metrics"""
    total_posts: int = 0
    avg_engagement_rate: float = 0.0
    avg_saves: float = 0.0
    avg_shares: float = 0.0
    avg_impressions: float = 0.0
    last_updated: Optional[datetime] = None


class Template(BaseModel):
    """
    LEGACY: Pydantic data model representing a template from the database.
    Use TemplateResponse for API responses instead.
    """
    # Required fields from database
    id: str
    name: str
    
    # Optional fields (no longer in database schema)
    team_id: Optional[str] = None  # Removed from DB - kept for backward compatibility
    user_id: Optional[str] = None  # Removed from DB - kept for backward compatibility
    
    # Optional fields with defaults
    is_default: Optional[bool] = False
    category: Optional[str] = ""  # Supabase: string
    status: Optional[str] = "active"  # Supabase: string
    created_at: Optional[str] = None  # Supabase: string (ISO)
    updated_at: Optional[str] = None  # Supabase: string (ISO)
    style_config: Optional[dict] = None  # Supabase: JSON | null
    content_rules: Optional[dict] = None  # Supabase: JSON
    brand_id: Optional[str] = None  # Supabase: string | null (PRIMARY KEY for access control)
    tags: Optional[List[str]] = None  # Supabase: string[] | null
    favorite: Optional[bool] = False  # Supabase: boolean
    parent_id: Optional[str] = None  # Supabase: string | null
    
    class Config:
        # Allow extra fields from JSON for flexibility
        extra = "allow"
