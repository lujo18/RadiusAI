"""
Brand Pydantic schemas for request/response DTOs
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ── Inbound (requests) ──────────────────────


class BrandCreate(BaseModel):
    """Request to create a new brand"""

    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    brand_settings: dict = Field(default_factory=dict)
    cta_settings: Optional[dict] = None


class BrandUpdate(BaseModel):
    """Request to update an existing brand"""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    brand_settings: Optional[dict] = None
    cta_settings: Optional[dict] = None


# ── Outbound (responses) ────────────────────


class BrandResponse(BaseModel):
    """Response with brand details"""

    id: str
    user_id: str
    team_id: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    brand_settings: dict
    cta_settings: Optional[dict] = None
    post_count: int
    template_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BrandListResponse(BaseModel):
    """Minimal brand info for list endpoints"""

    id: str
    name: Optional[str] = None
    post_count: int
    template_count: int
    created_at: datetime

    model_config = {"from_attributes": True}
