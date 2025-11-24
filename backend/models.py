# Backend Models for Firestore Template System

from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime
from enum import Enum

# ==================== ENUMS ====================

class TemplateCategory(str, Enum):
    LISTICLE = "listicle"
    QUOTE = "quote"
    STORY = "story"
    EDUCATIONAL = "educational"
    COMPARISON = "comparison"
    CUSTOM = "custom"

class TemplateStatus(str, Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"
    TESTING = "testing"

class HookStyle(str, Enum):
    QUESTION = "question"
    STATEMENT = "statement"
    NUMBER = "number"

class BackgroundType(str, Enum):
    GRADIENT = "gradient"
    SOLID = "solid"
    IMAGE = "image"

class AspectRatio(str, Enum):
    STORY = "9:16"
    SQUARE = "1:1"
    PORTRAIT = "4:5"

class VariantSetStatus(str, Enum):
    RUNNING = "running"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# ==================== TEMPLATE MODELS ====================

class BackgroundConfig(BaseModel):
    type: BackgroundType
    colors: List[str]
    opacity: float

class FontConfig(BaseModel):
    family: str
    size: int
    color: str
    effects: List[str]

class VisualConfig(BaseModel):
    background: BackgroundConfig
    font: FontConfig
    accentColor: str = Field(alias="accentColor")

class LayoutConfig(BaseModel):
    slideCount: int = Field(ge=5, le=10)
    aspectRatio: AspectRatio
    structure: List[str]

class ContentRules(BaseModel):
    tone: str
    hookStyle: HookStyle
    useEmojis: bool
    ctaTemplate: str
    forbiddenWords: List[str] = []

class StyleConfig(BaseModel):
    layout: LayoutConfig
    visual: VisualConfig
    content: ContentRules

class TemplatePerformance(BaseModel):
    totalPosts: int = 0
    avgEngagementRate: float = 0.0
    avgSaves: float = 0.0
    avgShares: float = 0.0
    avgImpressions: float = 0.0
    lastUpdated: Optional[datetime] = None

class Template(BaseModel):
    id: str
    userId: str
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

# ==================== ANALYTICS MODELS ====================

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

class Analytics(BaseModel):
    id: str
    postId: str
    templateId: str
    userId: str
    platform: Literal["instagram", "tiktok"]
    date: datetime
    metrics: PostMetrics
    variantSetId: Optional[str] = None

class TrackAnalyticsRequest(BaseModel):
    postId: str
    templateId: str
    platform: Literal["instagram", "tiktok"]
    metrics: PostMetrics
    variantSetId: Optional[str] = None

# ==================== A/B TESTING MODELS ====================

class TemplateStats(BaseModel):
    avgSaves: float
    avgEngagement: float
    avgImpressions: float
    avgEngagementRate: float
    totalPosts: int

class VariantSetResults(BaseModel):
    winningTemplateId: str
    confidenceScore: float
    stats: dict[str, TemplateStats]
    insights: List[str]
    completedAt: datetime

class VariantSet(BaseModel):
    id: str
    userId: str
    name: str
    templates: List[str]  # Template IDs
    startDate: datetime
    endDate: datetime
    status: VariantSetStatus
    postsPerTemplate: int
    results: Optional[VariantSetResults] = None

class CreateVariantSetRequest(BaseModel):
    name: str
    templates: List[str]
    postsPerTemplate: int = Field(ge=5, le=50)
    durationDays: int = Field(ge=1, le=30)

# ==================== GEMINI MODELS ====================

class Slide(BaseModel):
    slideNumber: int
    text: str
    imagePrompt: str

class GeminiCarouselResponse(BaseModel):
    slides: List[Slide]
    caption: str
    hashtags: List[str]

class GenerateContentRequest(BaseModel):
    templateId: str
    topic: str
    platform: Literal["instagram", "tiktok"] = "instagram"
    count: int = Field(default=1, ge=1, le=10)

class GenerateContentResponse(BaseModel):
    posts: List[GeminiCarouselResponse]
    templateUsed: str
    generatedAt: datetime

# ==================== POST MODELS ====================

class StorageUrls(BaseModel):
    slides: List[str] = []  # URLs to slide images in Firebase Storage
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

class Post(BaseModel):
    id: str
    userId: str
    templateId: str
    variantSetId: Optional[str] = None
    platform: Literal["instagram", "tiktok"]
    status: Literal["draft", "scheduled", "published", "failed"]
    createdAt: datetime
    updatedAt: Optional[datetime] = None
    scheduledTime: Optional[datetime] = None
    publishedTime: Optional[datetime] = None
    content: GeminiCarouselResponse
    storageUrls: StorageUrls = StorageUrls()
    analytics: PostAnalytics = PostAnalytics()
    metadata: PostMetadata = PostMetadata()

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
