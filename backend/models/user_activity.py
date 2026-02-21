"""
Team Activity Models for tracking team-based usage and activity.
Previously called UserActivity, now team-scoped after database normalization.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TeamActivity(BaseModel):
    """Tracks activity within a team for usage metrics (replaces UserActivity after normalization)"""
    id: int
    team_id: str  # Team context (primary key)
    usage: Optional[dict] = None  # JSON object with usage metrics
    period_start: Optional[str] = None  # ISO datetime string
    period_end: Optional[str] = None  # ISO datetime string
    updated_at: Optional[str] = None  # ISO datetime string


class UpdateTeamActivityRequest(BaseModel):
    """Update team activity metrics"""
    usage: dict  # Usage metrics as JSON


class TeamActivitySummary(BaseModel):
    """Summary of team activity"""
    team_id: str
    total_posts: int = 0
    total_templates: int = 0
    total_automations: int = 0
    last_activity: Optional[str] = None  # ISO datetime


# Backward compatibility aliases (deprecated)
UserActivity = TeamActivity
UpdateUserActivityRequest = UpdateTeamActivityRequest
