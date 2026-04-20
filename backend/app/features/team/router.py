"""
Team Router - HTTP endpoints for team and member management.

Endpoints:
- POST /teams - Create team
- GET /teams - List user's teams
- GET /teams/{team_id} - Get team details
- PATCH /teams/{team_id} - Update team (owner only)
- DELETE /teams/{team_id} - Delete team (owner only)
- POST /teams/{team_id}/members - Invite member (admin/owner only)
- GET /teams/{team_id}/members - List members
- PATCH /teams/{team_id}/members/{member_id} - Update member role (admin/owner only)
- DELETE /teams/{team_id}/members/{member_id} - Remove member (admin/owner only)
- GET /teams/{team_id}/audit-log - Get audit log
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Path, status
from typing import List

from app.core.security import get_current_user
from app.core.exceptions import AppError
from app.features.team.service import TeamService, get_team_service
from app.features.team.schemas import (
    Team,
    TeamDetail,
    TeamMemberInfo,
    CreateTeamRequest,
    UpdateTeamRequest,
    InviteTeamMemberRequest,
    UpdateTeamMemberRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/teams", tags=["teams"])


# ═════════ TEAM CRUD ═════════


@router.post("", response_model=Team, status_code=status.HTTP_201_CREATED)
async def create_team(
    request: CreateTeamRequest,
    user_id: str = Depends(get_current_user),
    team_service: TeamService = Depends(get_team_service),
):
    """Create a new team. User becomes the owner."""
    try:
        team = await team_service.create_team(user_id, request)
        return team
    except AppError as e:
        logger.warning(f"Team creation failed: {e}")
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        logger.exception("Unexpected error creating team")
        raise HTTPException(status_code=500, detail="Failed to create team")


@router.get("", response_model=List[Team])
async def list_user_teams(
    user_id: str = Depends(get_current_user),
    team_service: TeamService = Depends(get_team_service),
):
    """List all teams the user is a member of."""
    try:
        teams = await team_service.list_user_teams(user_id)
        return teams
    except AppError as e:
        logger.warning(f"Team list failed: {e}")
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        logger.exception("Unexpected error listing teams")
        raise HTTPException(status_code=500, detail="Failed to list teams")


@router.get("/{team_id}", response_model=TeamDetail)
async def get_team(
    team_id: str = Path(..., description="Team ID"),
    user_id: str = Depends(get_current_user),
    team_service: TeamService = Depends(get_team_service),
):
    """Get team details with member list."""
    try:
        team = await team_service.get_team(team_id, user_id)
        return team
    except AppError as e:
        logger.warning(f"Team fetch failed: {e}")
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        logger.exception("Unexpected error fetching team")
        raise HTTPException(status_code=500, detail="Failed to fetch team")


@router.patch("/{team_id}", response_model=Team)
async def update_team(
    request: UpdateTeamRequest,
    team_id: str = Path(..., description="Team ID"),
    user_id: str = Depends(get_current_user),
    team_service: TeamService = Depends(get_team_service),
):
    """Update team (owner only)."""
    try:
        team = await team_service.update_team(team_id, user_id, request)
        return team
    except AppError as e:
        logger.warning(f"Team update failed: {e}")
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        logger.exception("Unexpected error updating team")
        raise HTTPException(status_code=500, detail="Failed to update team")


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team(
    team_id: str = Path(..., description="Team ID"),
    user_id: str = Depends(get_current_user),
    team_service: TeamService = Depends(get_team_service),
):
    """Soft-delete team (owner only)."""
    try:
        await team_service.delete_team(team_id, user_id)
    except AppError as e:
        logger.warning(f"Team deletion failed: {e}")
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        logger.exception("Unexpected error deleting team")
        raise HTTPException(status_code=500, detail="Failed to delete team")


# ═════════ TEAM MEMBER MANAGEMENT ═════════


@router.post(
    "/{team_id}/members",
    response_model=TeamMemberInfo,
    status_code=status.HTTP_201_CREATED,
)
async def invite_member(
    request: InviteTeamMemberRequest,
    team_id: str = Path(..., description="Team ID"),
    user_id: str = Depends(get_current_user),
    team_service: TeamService = Depends(get_team_service),
):
    """Invite a user to team (admin/owner only)."""
    try:
        member = await team_service.invite_member(team_id, user_id, request)
        return member
    except AppError as e:
        logger.warning(f"Member invitation failed: {e}")
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        logger.exception("Unexpected error inviting member")
        raise HTTPException(status_code=500, detail="Failed to invite member")


@router.get("/{team_id}/members", response_model=List[TeamMemberInfo])
async def list_team_members(
    team_id: str = Path(..., description="Team ID"),
    user_id: str = Depends(get_current_user),
    team_service: TeamService = Depends(get_team_service),
):
    """List members in team."""
    try:
        team = await team_service.get_team(team_id, user_id)
        return team.members
    except AppError as e:
        logger.warning(f"Members list failed: {e}")
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        logger.exception("Unexpected error listing members")
        raise HTTPException(status_code=500, detail="Failed to list members")


@router.patch("/{team_id}/members/{member_id}", response_model=TeamMemberInfo)
async def update_member_role(
    request: UpdateTeamMemberRequest,
    team_id: str = Path(..., description="Team ID"),
    member_id: str = Path(..., description="Member ID"),
    user_id: str = Depends(get_current_user),
    team_service: TeamService = Depends(get_team_service),
):
    """Update member role (admin/owner only)."""
    try:
        member = await team_service.update_member_role(
            team_id, member_id, user_id, request
        )
        return member
    except AppError as e:
        logger.warning(f"Member role update failed: {e}")
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        logger.exception("Unexpected error updating member role")
        raise HTTPException(status_code=500, detail="Failed to update member role")


@router.delete("/{team_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    team_id: str = Path(..., description="Team ID"),
    member_id: str = Path(..., description="Member ID"),
    user_id: str = Depends(get_current_user),
    team_service: TeamService = Depends(get_team_service),
):
    """Remove member from team (admin/owner only)."""
    try:
        await team_service.remove_member(team_id, member_id, user_id)
    except AppError as e:
        logger.warning(f"Member removal failed: {e}")
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        logger.exception("Unexpected error removing member")
        raise HTTPException(status_code=500, detail="Failed to remove member")


# ═════════ AUDIT LOG ═════════


@router.get("/{team_id}/audit-log", response_model=List[dict])
async def get_audit_log(
    team_id: str = Path(..., description="Team ID"),
    limit: int = 100,
    user_id: str = Depends(get_current_user),
    team_service: TeamService = Depends(get_team_service),
):
    """Get audit log for team (members only)."""
    try:
        events = await team_service.get_audit_log(team_id, user_id, limit)
        return events
    except AppError as e:
        logger.warning(f"Audit log fetch failed: {e}")
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        logger.exception("Unexpected error fetching audit log")
        raise HTTPException(status_code=500, detail="Failed to fetch audit log")
