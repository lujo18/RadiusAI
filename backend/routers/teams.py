"""
Team Router - FastAPI endpoints for team management.

Endpoints:
- POST /api/teams - Create team
- GET /api/teams - List user's teams
- GET /api/teams/{team_id} - Get team details
- PATCH /api/teams/{team_id} - Update team
- DELETE /api/teams/{team_id} - Delete team
- POST /api/teams/{team_id}/members - Invite member
- GET /api/teams/{team_id}/members - List members
- PATCH /api/teams/{team_id}/members/{member_id} - Update member role
- DELETE /api/teams/{team_id}/members/{member_id} - Remove member
- GET /api/teams/{team_id}/events - Get audit log
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from backend.auth import get_current_user
from backend.services.team_service import TeamService
from backend.models.team import (
    Team, TeamDetail, TeamMemberInfo, TeamEvent,
    CreateTeamRequest, UpdateTeamRequest,
    InviteTeamMemberRequest, UpdateTeamMemberRequest
)


router = APIRouter(prefix="/api/teams", tags=["teams"])
team_service = TeamService()


# ============================================================================
# TEAM CRUD ENDPOINTS
# ============================================================================

@router.post("", response_model=Team, status_code=status.HTTP_201_CREATED)
async def create_team(
    request: CreateTeamRequest,
    user_id: str = Depends(get_current_user)
):
    """Create a new team. User becomes the owner."""
    return await team_service.create_team(user_id, request)


@router.get("", response_model=List[Team])
async def list_user_teams(
    user_id: str = Depends(get_current_user)
):
    """List all teams the user is a member of."""
    return await team_service.list_user_teams(user_id)


@router.get("/{team_id}", response_model=TeamDetail)
async def get_team(
    team_id: str,
    user_id: str = Depends(get_current_user)
):
    """Get team details with member list."""
    return await team_service.get_team(team_id, user_id)


@router.patch("/{team_id}", response_model=Team)
async def update_team(
    team_id: str,
    request: UpdateTeamRequest,
    user_id: str = Depends(get_current_user)
):
    """Update team (owner only)."""
    return await team_service.update_team(team_id, user_id, request)


@router.delete("/{team_id}")
async def delete_team(
    team_id: str,
    user_id: str = Depends(get_current_user)
):
    """Soft-delete team (owner only)."""
    return await team_service.delete_team(team_id, user_id)


# ============================================================================
# TEAM MEMBER ENDPOINTS
# ============================================================================

@router.post("/{team_id}/members", response_model=TeamMemberInfo, status_code=status.HTTP_201_CREATED)
async def invite_team_member(
    team_id: str,
    request: InviteTeamMemberRequest,
    user_id: str = Depends(get_current_user)
):
    """Invite a user to a team (admin/owner only)."""
    return await team_service.invite_team_member(team_id, user_id, request)


@router.get("/{team_id}/members", response_model=List[TeamMemberInfo])
async def list_team_members(
    team_id: str,
    user_id: str = Depends(get_current_user)
):
    """List all members of a team."""
    team = await team_service.get_team(team_id, user_id)
    return team.members


@router.patch("/{team_id}/members/{member_id}", response_model=TeamMemberInfo)
async def update_team_member_role(
    team_id: str,
    member_id: str,
    request: UpdateTeamMemberRequest,
    user_id: str = Depends(get_current_user)
):
    """Update a team member's role (admin/owner only)."""
    return await team_service.update_team_member_role(team_id, member_id, user_id, request)


@router.delete("/{team_id}/members/{member_id}")
async def remove_team_member(
    team_id: str,
    member_id: str,
    user_id: str = Depends(get_current_user)
):
    """Remove a team member (admin/owner only)."""
    return await team_service.remove_team_member(team_id, member_id, user_id)


# ============================================================================
# AUDIT LOG ENDPOINTS
# ============================================================================

@router.get("/{team_id}/events", response_model=List[TeamEvent])
async def get_team_audit_log(
    team_id: str,
    limit: int = 50,
    user_id: str = Depends(get_current_user)
):
    """Get audit log for a team (members only)."""
    return await team_service.get_team_events(team_id, user_id, limit)
