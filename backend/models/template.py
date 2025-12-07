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
    slideCount: int = Field(ge=3, le=10)
    aspectRatio: AspectRatio


class ContentRules(BaseModel):
  format: str
  slideCount: int = Field(ge=3, le=10)
  perspective: str
  depthLevel: Literal['surface', 'detailed', 'comprehensive']
  topicFocus: str
  subtopics: Optional[List[str]] = None
  hookStyle: str
  bodyStyle: str
  ctaStyle: str
  includeExamples: bool
  includeStatistics: bool
  personalStory: bool
  avoidTopics: Optional[List[str]] = None
  mustInclude: Optional[List[str]] = None
    
    

class StyleConfig(BaseModel):
    layout: LayoutConfig
    contentRules: Optional[ContentRules] = None # TODO: update the typescript/frontend functionality (see comment there), then fix this
    slideDesigns: List[SlideDesign] 
    slideSequence: List[SlideSequence] 


class TemplatePerformance(BaseModel):
    totalPosts: int = 0
    avgEngagementRate: float = 0.0
    avgSaves: float = 0.0
    avgShares: float = 0.0
    avgImpressions: float = 0.0
    lastUpdated: Optional[datetime] = None

# ==================== TEMPLATE MODELS ====================

class Template(BaseModel):
    id: str
    name: str
    isDefault: bool = False
    category: TemplateCategory
    status: TemplateStatus = TemplateStatus.ACTIVE
    createdAt: datetime
    updatedAt: datetime
    styleConfig: StyleConfig
    geminiPrompt: Optional[str] = None
    performance: TemplatePerformance = TemplatePerformance()
    parentTemplateId: Optional[str] = None

class CreateTemplateRequest(BaseModel):
    name: str
    category: TemplateCategory
    styleConfig: StyleConfig
    isDefault: bool = False

class UpdateTemplateRequest(BaseModel):
    name: Optional[str] = None
    category: Optional[TemplateCategory] = None
    status: Optional[TemplateStatus] = None
    styleConfig: Optional[StyleConfig] = None
    isDefault: Optional[bool] = None
