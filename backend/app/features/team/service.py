"""
Team Service - Business logic for team management, members, and permissions.

Handles:
- Team CRUD operations
- Team member management (invite, remove, role changes)
- Audit logging for team events
- Permission checking
"""

import logging
from typing import Optional
from fastapi import Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from uuid import uuid4

from app.core.exceptions import (
    NotFoundError,
    PermissionError,
    ConflictError,
    ValidationError,
)
from app.features.team.models import (
    Team,
    TeamMember,
    TeamEvent,
    TeamRole,
    TeamMemberStatus,
)
from app.features.team.schemas import (
    Team as TeamSchema,
    TeamDetail,
    TeamMemberInfo,
    CreateTeamRequest,
    UpdateTeamRequest,
    InviteTeamMemberRequest,
    UpdateTeamMemberRequest,
)
from app.features.team.repository import team_repo, members_repo, events_repo


from backend.auth import get_current_user

logger = logging.getLogger(__name__)


class TeamService:
    """Service for team management operations."""

    # ═════════ TEAM CRUD ═════════

    async def create_team(
        self, db: AsyncSession, user_id: str, payload: CreateTeamRequest
    ) -> TeamSchema:
        """Create a new team with the user as owner."""
        team_id = f"team_{uuid4().hex[:12]}"

        # Create team
        team = Team(
            id=team_id,
            owner_id=user_id,
            name=payload.name,
            slug=payload.slug,
            description=payload.description,
        )
        created_team = await team_repo.create(db, team)

        # Add user as owner
        member_id = f"tmem_{uuid4().hex[:12]}"
        owner_member = TeamMember(
            id=member_id,
            team_id=team_id,
            user_id=user_id,
            role=TeamRole.OWNER.value,
            status=TeamMemberStatus.ACTIVE.value,
            accepted_at=datetime.utcnow(),
        )
        await members_repo.create(db, owner_member)

        # Log creation
        await self._log_event(
            db, team_id, "team_created", user_id, user_id, {"team_name": team.name}
        )

        logger.info(f"Team created: {team_id} by user {user_id}")
        return TeamSchema.model_validate(created_team)

    async def get_team(
        self, db: AsyncSession, team_id: str, user_id: str
    ) -> TeamDetail:
        """
        Get team with full details including members.

        Verifies user is a member of the team.
        """
        team = await team_repo.get(db, team_id)
        if not team:
            raise NotFoundError("Team", team_id)

        # Check membership
        member = await members_repo.get_by_team_and_user(db, team_id, user_id)
        if not member:
            raise PermissionError(f"User {user_id} is not a member of team {team_id}")

        # Get all active members
        team_members = await members_repo.get_by_team(db, team_id)
        member_infos = [
            TeamMemberInfo(
                id=m.id,
                user_id=m.user_id,
                email="",  # TODO: Join with users table to get email
                role=m.role,
                status=m.status,
                invited_at=m.invited_at.isoformat() if m.invited_at else None,
                accepted_at=m.accepted_at.isoformat() if m.accepted_at else None,
                created_at=m.created_at.isoformat(),
                updated_at=m.updated_at.isoformat(),
            )
            for m in team_members
        ]

        return TeamDetail(
            id=team.id,
            owner_id=team.owner_id,
            name=team.name,
            slug=team.slug,
            description=team.description,
            avatar_url=team.avatar_url,
            metadata=team.metadata,
            created_at=team.created_at.isoformat(),
            updated_at=team.updated_at.isoformat(),
            deleted_at=team.deleted_at.isoformat() if team.deleted_at else None,
            member_count=len(member_infos),
            members=member_infos,
        )

    async def list_user_teams(self, db: AsyncSession, user_id: str) -> list[TeamSchema]:
        """List all teams a user is a member of."""
        teams = await team_repo.get_user_teams(db, user_id)
        return [TeamSchema.model_validate(t) for t in teams]

    async def update_team(
        self, db: AsyncSession, team_id: str, user_id: str, payload: UpdateTeamRequest
    ) -> TeamSchema:
        """Update team (owner only)."""
        team = await team_repo.get(db, team_id)
        if not team:
            raise NotFoundError("Team", team_id)

        # Verify owner
        if team.owner_id != user_id:
            raise PermissionError("Only team owner can update team")

        # Update fields
        if payload.name:
            team.name = payload.name
        if payload.slug:
            team.slug = payload.slug
        if payload.description is not None:
            team.description = payload.description
        if payload.avatar_url:
            team.avatar_url = payload.avatar_url

        updated = await team_repo.update(db, team)

        # Log update
        await self._log_event(
            db,
            team_id,
            "team_updated",
            user_id,
            user_id,
            {"updated_fields": list(payload.model_dump(exclude_none=True).keys())},
        )

        logger.info(f"Team updated: {team_id} by user {user_id}")
        return TeamSchema.model_validate(updated)

    async def delete_team(self, db: AsyncSession, team_id: str, user_id: str) -> None:
        """Soft-delete team (owner only)."""
        team = await team_repo.get(db, team_id)
        if not team:
            raise NotFoundError("Team", team_id)

        # Verify owner
        if team.owner_id != user_id:
            raise PermissionError("Only team owner can delete team")

        # Soft delete
        team.deleted_at = datetime.utcnow()
        await team_repo.update(db, team)

        # Log deletion
        await self._log_event(db, team_id, "team_deleted", user_id, user_id)

        logger.info(f"Team deleted: {team_id} by user {user_id}")

    # ═════════ TEAM MEMBER MANAGEMENT ═════════

    async def invite_member(
        self,
        db: AsyncSession,
        team_id: str,
        user_id: str,
        payload: InviteTeamMemberRequest,
    ) -> TeamMemberInfo:
        """Invite a user to team (admin/owner only)."""
        # Verify permissions
        member = await members_repo.get_by_team_and_user(db, team_id, user_id)
        if not member or member.role == TeamRole.VIEWER.value:
            raise PermissionError("Only admins/owners can invite members")

        # Check if already member
        existing = await members_repo.get_by_team_and_user(db, team_id, payload.email)
        if existing:
            raise ConflictError(f"User is already a member of team {team_id}")

        # Create membership
        member_id = f"tmem_{uuid4().hex[:12]}"
        new_member = TeamMember(
            id=member_id,
            team_id=team_id,
            user_id=payload.email,  # Placeholder - would need user lookup by email
            role=payload.role,
            status=TeamMemberStatus.INVITED.value,
            invited_by=user_id,
            invited_at=datetime.utcnow(),
        )
        created = await members_repo.create(db, new_member)

        # Log event
        await self._log_event(
            db,
            team_id,
            "member_invited",
            user_id,
            payload.email,
            {"role": payload.role},
        )

        logger.info(f"User {payload.email} invited to team {team_id} by {user_id}")

        return TeamMemberInfo(
            id=created.id,
            user_id=created.user_id,
            email=payload.email,
            role=created.role,
            status=created.status,
            invited_at=created.invited_at.isoformat() if created.invited_at else None,
            accepted_at=None,
            created_at=created.created_at.isoformat(),
            updated_at=created.updated_at.isoformat(),
        )

    async def update_member_role(
        self,
        db: AsyncSession,
        team_id: str,
        member_id: str,
        user_id: str,
        payload: UpdateTeamMemberRequest,
    ) -> TeamMemberInfo:
        """Update member role (admin/owner only)."""
        # Verify permissions
        requester = await members_repo.get_by_team_and_user(db, team_id, user_id)
        if not requester or requester.role == TeamRole.VIEWER.value:
            raise PermissionError("Only admins/owners can update roles")

        member = await members_repo.get(db, member_id)
        if not member or member.team_id != team_id:
            raise NotFoundError("TeamMember", member_id)

        # Prevent demoting last owner
        if member.role == TeamRole.OWNER.value and payload.role != TeamRole.OWNER.value:
            owner_count = len(
                await members_repo.get_by_role(db, team_id, TeamRole.OWNER.value)
            )
            if owner_count <= 1:
                raise ValidationError("Cannot demote the last team owner")

        # Update role
        member.role = payload.role
        updated = await members_repo.update(db, member)

        # Log event
        await self._log_event(
            db,
            team_id,
            "member_role_updated",
            user_id,
            member.user_id,
            {"new_role": payload.role},
        )

        logger.info(
            f"Member {member.user_id} role updated to {payload.role} in team {team_id}"
        )

        return TeamMemberInfo(
            id=updated.id,
            user_id=updated.user_id,
            email="",
            role=updated.role,
            status=updated.status,
            invited_at=updated.invited_at.isoformat() if updated.invited_at else None,
            accepted_at=updated.accepted_at.isoformat()
            if updated.accepted_at
            else None,
            created_at=updated.created_at.isoformat(),
            updated_at=updated.updated_at.isoformat(),
        )

    async def remove_member(
        self, db: AsyncSession, team_id: str, member_id: str, user_id: str
    ) -> None:
        """Remove member from team (admin/owner only)."""
        # Verify permissions
        requester = await members_repo.get_by_team_and_user(db, team_id, user_id)
        if not requester or requester.role == TeamRole.VIEWER.value:
            raise PermissionError("Only admins/owners can remove members")

        member = await members_repo.get(db, member_id)
        if not member or member.team_id != team_id:
            raise NotFoundError("TeamMember", member_id)

        # Prevent removing last owner
        if member.role == TeamRole.OWNER.value:
            owner_count = len(
                await members_repo.get_by_role(db, team_id, TeamRole.OWNER.value)
            )
            if owner_count <= 1:
                raise ValidationError("Cannot remove the last team owner")

        # Mark as removed
        member.status = TeamMemberStatus.REMOVED.value
        await members_repo.update(db, member)

        # Log event
        await self._log_event(db, team_id, "member_removed", user_id, member.user_id)

        logger.info(f"Member {member.user_id} removed from team {team_id} by {user_id}")

    # ═════════ AUDIT LOGGING ═════════

    async def _log_event(
        self,
        db: AsyncSession,
        team_id: str,
        event_type: str,
        actor_id: str,
        subject_id: str,
        payload: dict = None,
    ) -> TeamEvent:
        """Log a team event for audit trails."""
        event_id = f"tev_{uuid4().hex[:12]}"
        event = TeamEvent(
            id=event_id,
            team_id=team_id,
            event_type=event_type,
            actor_id=actor_id,
            subject_id=subject_id,
            payload=payload or {},
        )
        return await events_repo.create(db, event)

    async def get_audit_log(
        self, db: AsyncSession, team_id: str, user_id: str, limit: int = 100
    ) -> list[dict]:
        """Get audit log for team (members only)."""
        # Verify membership
        member = await members_repo.get_by_team_and_user(db, team_id, user_id)
        if not member:
            raise PermissionError(f"User not a member of team {team_id}")

        events = await events_repo.get_by_team(db, team_id, limit)
        return [
            {
                "id": e.id,
                "event_type": e.event_type,
                "actor_id": e.actor_id,
                "subject_id": e.subject_id,
                "payload": e.payload,
                "created_at": e.created_at.isoformat(),
            }
            for e in events
        ]
        
        
        
# ============ TEAM MEMBER AUTHORIZATION ==================



async def get_current_team(
    team_id: Optional[str] = Query(None),
    user_id: str = Depends(get_current_user),
):
    # if client passed a team_id, verify membership
    if team_id:
        member = await members_repo.get_by_team_and_user(team_id, user_id)
        if not member or member.status != 'active':
            raise HTTPException(status_code=403, detail="Not a member of that team")
        return team_id

    # fast path: read active_team_id from users table (returned by get_current_user)
    # if get_current_user only returns id, do a quick repo lookup:
    teams = await team_repo.get_user_teams(user_id)
    if not teams:
        raise HTTPException(status_code=404, detail="No team found for user")
    return teams[0].id


# Module-level singleton
team_service = TeamService()
