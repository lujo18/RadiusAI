# A/B Testing / Variant Set Models

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from .enums import VariantSetStatus

# ==================== VARIANT SUB-MODELS ====================

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

# ==================== VARIANT SET MODELS ====================

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
