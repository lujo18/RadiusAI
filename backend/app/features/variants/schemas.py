"""
Variants Pydantic schemas for request/response DTOs
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime


class TemplateStats(BaseModel):
    """Performance statistics for a template variant"""

    avg_saves: float
    avg_engagement: float
    avg_impressions: float
    avg_engagement_rate: float
    total_posts: int


class VariantSetResults(BaseModel):
    """Results of completed variant test"""

    winning_template_id: str
    confidence_score: float
    stats: dict[str, TemplateStats]
    insights: List[str]
    completed_at: datetime


class VariantSet(BaseModel):
    """Variant set for A/B testing"""

    id: str
    team_id: str
    user_id: str
    name: str
    description: Optional[str]
    templates: List[str]
    start_date: datetime
    end_date: Optional[datetime]
    status: Literal["active", "paused", "completed"]
    posts_per_template: int
    total_duration_days: int
    results: Optional[VariantSetResults]
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]


class CreateVariantSetRequest(BaseModel):
    """Request to create variant test"""

    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    templates: List[str] = Field(min_items=2, max_items=10)
    posts_per_template: int = Field(ge=1, le=50, default=5)
    duration_days: int = Field(ge=1, le=90, default=7)


class UpdateVariantSetRequest(BaseModel):
    """Request to update variant set"""

    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[Literal["active", "paused", "completed"]] = None


class CompleteVariantSetRequest(BaseModel):
    """Request to complete variant test and get results"""

    variant_set_id: str


class VariantPerformanceResponse(BaseModel):
    """Performance metrics for a variant"""

    template_id: str
    total_posts: int
    avg_impressions: float
    avg_reach: float
    avg_engagement: float
    avg_engagement_rate: float
    overall_score: float
    confidence_score: float
    is_winning: bool


class VariantResultResponse(BaseModel):
    """A/B test results"""

    variant_set_id: str
    winning_template_id: str
    confidence_score: float
    performance_breakdown: List[VariantPerformanceResponse]
    insights: List[str]
    recommendation: str
