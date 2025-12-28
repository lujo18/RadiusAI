# Template Models

from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime

from backend.models.slide import SlideDesign, SlideSequence
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
    content_rules: Optional[ContentRules] = None # TODO: update the typescript/frontend functionality (see comment there), then fix this
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
    id: str
    name: str
    is_default: bool = False
    category: TemplateCategory
    status: TemplateStatus = TemplateStatus.ACTIVE
    created_at: datetime
    updated_at: datetime
    style_config: StyleConfig
    gemini_prompt: Optional[str] = None
    performance: TemplatePerformance = TemplatePerformance()
    parent_template_id: Optional[str] = None

class CreateTemplateRequest(BaseModel):
    name: str
    category: TemplateCategory
    style_config: StyleConfig
    is_default: bool = False

class UpdateTemplateRequest(BaseModel):
    name: Optional[str] = None
    category: Optional[TemplateCategory] = None
    status: Optional[TemplateStatus] = None
    style_config: Optional[StyleConfig] = None
    is_default: Optional[bool] = None
