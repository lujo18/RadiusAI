"""
Brand Models for team-owned brands.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class Brand(BaseModel):
    """Represents a brand owned by a team"""
    id: str
    team_id: str  # Team ownership (primary)
    user_id: str  # Creator attribution (who created this brand within the team)
    late_profile_id: str
    description: Optional[str] = None
    brand_settings: dict = {}  # JSON settings
    cta_settings: Optional[dict] = None  # JSON settings
    post_count: int = 0
    template_count: int = 0
    created_at: str
    updated_at: str


class CreateBrandRequest(BaseModel):
    team_id: str  # NOW REQUIRED: Must specify team when creating
    late_profile_id: str
    description: Optional[str] = None
    brand_settings: dict = {}
    cta_settings: Optional[dict] = None


class UpdateBrandRequest(BaseModel):
    description: Optional[str] = None
    brand_settings: Optional[dict] = None
    cta_settings: Optional[dict] = None
