# Template Models

from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime

from .slide import SlideDesign, SlideSequence
from .enums import (
    TemplateCategory,
    TemplateStatus,
    HookStyle,
    BackgroundType,
    AspectRatio
)

# ==================== CONFIGURATION MODELS ====================

class LayoutConfig(BaseModel):
    slide_count: int = Field(ge=3, le=10)
    aspect_ratio: AspectRatio


class ContentRules(BaseModel):
  format: str
  slide_count: int = Field(ge=3, le=10)
  perspective: str
  depth_level: Literal['surface', 'detailed', 'comprehensive']
  topic_focus: str
  subtopics: Optional[List[str]] = None
  hook_style: str
  body_style: str
  cta_style: str
  include_examples: bool
  include_statistics: bool
  personal_story: bool
  avoid_topics: Optional[List[str]] = None
  must_include: Optional[List[str]] = None
    
    

class StyleConfig(BaseModel):
    layout: LayoutConfig
    slide_designs: List[SlideDesign]
    slide_sequence: List[SlideSequence] 


class TemplatePerformance(BaseModel):
    total_posts: int = 0
    avg_engagement_rate: float = 0.0
    avg_saves: float = 0.0
    avg_shares: float = 0.0
    avg_impressions: float = 0.0
    last_updated: Optional[datetime] = None

# ==================== TEMPLATE MODELS ====================

class Template(BaseModel):
    # Required fields from database
    id: str
    name: str
    user_id: str
    
    # Optional fields with defaults
    is_default: Optional[bool] = False
    category: Optional[str] = ""  # Supabase: string
    status: Optional[str] = "active"  # Supabase: string
    created_at: Optional[str] = None  # Supabase: string (ISO)
    updated_at: Optional[str] = None  # Supabase: string (ISO)
    style_config: Optional[dict] = None  # Supabase: JSON | null
    content_rules: Optional[dict] = None  # Supabase: JSON
    brand_id: Optional[str] = None  # Supabase: string | null
    tags: Optional[List[str]] = None  # Supabase: string[] | null
    favorite: Optional[bool] = False  # Supabase: boolean
    parent_id: Optional[str] = None  # Supabase: string | null
    
    class Config:
        # Allow extra fields from JSON for flexibility
        extra = "allow"

class CreateTemplateRequest(BaseModel):
    name: str
    category: str  # Changed from TemplateCategory to str to match Supabase
    style_config: Optional[StyleConfig] = None
    content_rules: dict  # Required for Supabase
    is_default: bool = False
    brand_id: Optional[str] = None
    tags: Optional[List[str]] = None
    favorite: bool = False
    parent_id: Optional[str] = None

class UpdateTemplateRequest(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None  # Changed from TemplateCategory to str
    status: Optional[str] = None  # Changed from TemplateStatus to str
    style_config: Optional[StyleConfig] = None
    content_rules: Optional[dict] = None
    is_default: Optional[bool] = None
    brand_id: Optional[str] = None
    tags: Optional[List[str]] = None
    favorite: Optional[bool] = None
    parent_id: Optional[str] = None
