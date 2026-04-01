# A/B Testing / Variant Set Models

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from .enums import VariantSetStatus

# ==================== VARIANT SUB-MODELS ====================


class TemplateStats(BaseModel):
    """Aggregated statistics for a single template in an experiment."""
    avgSaves: float
    avgEngagement: float
    avgImpressions: float
    avgEngagementRate: float
    totalPosts: int


class VariantSetResults(BaseModel):
    """Results and insights produced after a variant set completes."""
    winningTemplateId: str
    confidenceScore: float
    stats: dict[str, TemplateStats]
    insights: List[str]
    completedAt: datetime


# ==================== VARIANT SET MODELS ====================


class VariantSet(BaseModel):
    """Representation of an A/B variant set and its configuration."""
    id: str
    team_id: str  # Team ownership (primary)
    user_id: str  # Creator attribution
    name: str
    templates: List[str]  # Template IDs
    start_date: str  # Supabase: string (ISO)
    end_date: str  # Supabase: string (ISO)
    status: str  # Supabase: string
    posts_per_template: int
    results: Optional[dict] = None


class CreateVariantSetRequest(BaseModel):
    """Request payload for creating a new variant set."""
    teamId: str  # NOW REQUIRED: Must specify team when creating
    name: str
    templates: List[str]
    postsPerTemplate: int = Field(ge=5, le=50)
    durationDays: int = Field(ge=1, le=30)
