"""
Team Pydantic schemas for request/response DTOs
"""

from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal


# ==================== TEAM SUB-SCHEMAS ====================


class TeamMemberInfo(BaseModel):
    """Represents a team member"""

    id: str
    user_id: Optional[str] = None
    email: str
    role: Literal["owner", "admin", "member", "viewer"] = "member"
    status: Literal["active", "pending", "invited", "removed"] = "pending"
    invited_at: Optional[str] = None
    accepted_at: Optional[str] = None
    created_at: str
    updated_at: str


# ==================== TEAM SCHEMAS ====================


class Team(BaseModel):
    """Represents a team"""

    id: str
    owner_id: str  # The user who owns this team
    name: str
    slug: str
    description: Optional[str] = None
    avatar_url: Optional[str] = None
    metadata: Optional[dict] = None
    created_at: str
    updated_at: str
    deleted_at: Optional[str] = None


class TeamDetail(Team):
    """Team with additional context (member count, etc.)"""

    member_count: int = 0
    members: List[TeamMemberInfo] = []


class CreateTeamRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    slug: str = Field(min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")
    description: Optional[str] = None


class UpdateTeamRequest(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    avatar_url: Optional[str] = None
    polar_customer_id: Optional[str] = None


class InviteTeamMemberRequest(BaseModel):
    email: EmailStr
    role: Literal["admin", "member", "viewer"] = "member"


class UpdateTeamMemberRequest(BaseModel):
    role: Literal["admin", "member", "viewer"]


class TeamEventSchema(BaseModel):
    """Audit log entry for team actions"""

    id: str
    team_id: str
    actor_id: Optional[str] = None
    event_type: str
    payload: Optional[dict] = None
    created_at: str
