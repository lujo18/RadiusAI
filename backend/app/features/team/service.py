"""
Team service layer.

Encapsulates business logic for team CRUD, member management, and audit logging.
"""

import logging
from datetime import datetime
from typing import Literal, Optional, cast
from uuid import uuid4

from fastapi import Depends, HTTPException, Query

from app.core.database import get_db_session
from app.core.db_safety import safe_instance_get, safe_set_if_column_exists
from app.core.exceptions import ConflictError, NotFoundError, PermissionError, ValidationError
from app.core.security import get_current_user
from app.features.team.models import Team, TeamEvent, TeamMember, TeamMemberStatus, TeamRole
from app.features.team.repository import TeamEventRepository, TeamMemberRepository, TeamRepository
from app.features.team.schemas import (
    CreateTeamRequest,
    InviteTeamMemberRequest,
    Team as TeamSchema,
    TeamDetail,
    TeamMemberInfo,
    UpdateTeamMemberRequest,
    UpdateTeamRequest,
)

logger = logging.getLogger(__name__)

TeamRoleLiteral = Literal["owner", "admin", "member", "viewer"]
TeamStatusLiteral = Literal["active", "pending", "invited", "removed"]


class TeamService:
    """Business logic for team operations."""

    def __init__(
        self,
        team_repository: Optional[TeamRepository] = None,
        member_repository: Optional[TeamMemberRepository] = None,
        event_repository: Optional[TeamEventRepository] = None,
    ):
        self.team_repository = team_repository or TeamRepository()
        self.member_repository = member_repository or TeamMemberRepository()
        self.event_repository = event_repository or TeamEventRepository()

    @staticmethod
    def _to_team_schema(team: Team) -> TeamSchema:
        # Read optional metadata without forcing lazy-load IO.
        metadata = safe_instance_get(team, "team_metadata")
        # Prefer raw attribute values from __dict__ to avoid triggering lazy-load IO
        id_val = safe_instance_get(team, "id") or team.id
        owner_val = safe_instance_get(team, "owner_id") or team.owner_id
        created_val = safe_instance_get(team, "created_at") or team.created_at
        updated_val = safe_instance_get(team, "updated_at") or team.updated_at
        deleted_val = safe_instance_get(team, "deleted_at") or team.deleted_at

        return TeamSchema(
            id=str(id_val),
            owner_id=str(owner_val),
            name=team.name,
            slug=team.slug,
            description=team.description,
            avatar_url=team.avatar_url,
            metadata=metadata or {},
            created_at=created_val.isoformat(),
            updated_at=updated_val.isoformat(),
            deleted_at=deleted_val.isoformat() if deleted_val else None,
        )

    @staticmethod
    def _to_member_info(member: TeamMember, email: str = "") -> TeamMemberInfo:
        role_value = (
            member.role
            if member.role in {"owner", "admin", "member", "viewer"}
            else TeamRole.MEMBER.value
        )
        status_value = (
            member.status
            if member.status in {"active", "pending", "invited", "removed"}
            else TeamMemberStatus.PENDING.value
        )
        return TeamMemberInfo(
            id=member.id,
            user_id=member.user_id,
            email=email,
            role=cast(TeamRoleLiteral, role_value),
            status=cast(TeamStatusLiteral, status_value),
            invited_at=member.invited_at.isoformat() if member.invited_at else None,
            accepted_at=member.accepted_at.isoformat() if member.accepted_at else None,
            created_at=member.created_at.isoformat(),
            updated_at=member.updated_at.isoformat(),
        )

    async def _get_membership(self, db, team_id: str, user_id: str) -> Optional[TeamMember]:
        return await self.member_repository.get_by_team_and_user(db, team_id, user_id)

    async def _log_event(
        self,
        db,
        team_id: str,
        event_type: str,
        actor_id: str,
        subject_id: str,
        payload: Optional[dict] = None,
    ) -> TeamEvent:
        event = TeamEvent(
            id=f"tev_{uuid4().hex[:12]}",
            team_id=team_id,
            event_type=event_type,
            actor_id=actor_id,
            subject_id=subject_id,
            payload=payload or {},
        )
        return await self.event_repository.create(db, event)

    async def get_membership(self, team_id: str, user_id: str) -> Optional[TeamMember]:
        """Return membership for a user in a team if present."""
        async with get_db_session() as db:
            return await self._get_membership(db, team_id, user_id)

    async def create_team(self, user_id: str, payload: CreateTeamRequest) -> TeamSchema:
        """Create a new team and add creator as owner."""
        async with get_db_session() as db:
            team_id = f"team_{uuid4().hex[:12]}"
            team = Team(
                id=team_id,
                owner_id=user_id,
                name=payload.name,
                slug=payload.slug,
                description=payload.description,
            )
            created_team = await self.team_repository.create(db, team)

            owner_member = TeamMember(
                id=f"tmem_{uuid4().hex[:12]}",
                team_id=team_id,
                user_id=user_id,
                role=TeamRole.OWNER.value,
                status=TeamMemberStatus.ACTIVE.value,
                accepted_at=datetime.utcnow(),
            )
            await self.member_repository.create(db, owner_member)

            await self._log_event(
                db=db,
                team_id=team_id,
                event_type="team_created",
                actor_id=user_id,
                subject_id=user_id,
                payload={"team_name": team.name},
            )

            logger.info(f"Team created: {team_id} by user {user_id}")
            return self._to_team_schema(created_team)

    async def get_team(self, team_id: str, user_id: str) -> TeamDetail:
        """Get team with members after membership verification."""
        async with get_db_session() as db:
            team = await self.team_repository.get_by_id(db, team_id)
            if not team:
                raise NotFoundError("Team", team_id)

            membership = await self._get_membership(db, team_id, user_id)
            if not membership or membership.status != TeamMemberStatus.ACTIVE.value:
                raise PermissionError(f"User {user_id} is not an active member of team {team_id}")

            members = await self.member_repository.get_by_team(db, team_id)
            member_infos = [self._to_member_info(member) for member in members]
            team_schema = self._to_team_schema(team)

            return TeamDetail(
                **team_schema.model_dump(),
                member_count=len(member_infos),
                members=member_infos,
            )

    async def list_user_teams(self, user_id: str) -> list[TeamSchema]:
        """List teams where the user is an active member."""
        async with get_db_session() as db:
            team_refs = await self.team_repository.get_user_teams(db, user_id)
            teams: list[TeamSchema] = []
            seen_ids: set[str] = set()

            for team_ref in team_refs:
                team_id = team_ref.get("id")
                if not team_id or team_id in seen_ids:
                    continue
                seen_ids.add(team_id)

                team = await self.team_repository.get_by_id(db, team_id)
                if team:
                    teams.append(self._to_team_schema(team))

            return teams

    async def update_team(
        self, team_id: str, user_id: str, payload: UpdateTeamRequest
    ) -> TeamSchema:
        """Update a team (owner only)."""
        async with get_db_session() as db:
            team = await self.team_repository.get_by_id(db, team_id)
            if not team:
                raise NotFoundError("Team", team_id)

            if team.owner_id != user_id:
                raise PermissionError("Only team owner can update team")

            if payload.name is not None:
                team.name = payload.name
            if payload.slug is not None:
                team.slug = payload.slug
            if payload.description is not None:
                team.description = payload.description
            if payload.avatar_url is not None:
                team.avatar_url = payload.avatar_url
            if payload.polar_customer_id is not None:
                safe_set_if_column_exists(team, "polar_customer_id", payload.polar_customer_id)

            updated = await self.team_repository.update(db, team)

            await self._log_event(
                db=db,
                team_id=team_id,
                event_type="team_updated",
                actor_id=user_id,
                subject_id=user_id,
                payload={"updated_fields": list(payload.model_dump(exclude_none=True).keys())},
            )

            logger.info(f"Team updated: {team_id} by user {user_id}")
            return self._to_team_schema(updated)

    async def delete_team(self, team_id: str, user_id: str) -> None:
        """Soft-delete a team (owner only)."""
        async with get_db_session() as db:
            team = await self.team_repository.get_by_id(db, team_id)
            if not team:
                raise NotFoundError("Team", team_id)

            if team.owner_id != user_id:
                raise PermissionError("Only team owner can delete team")

            team.deleted_at = datetime.utcnow()
            await self.team_repository.update(db, team)
            await self._log_event(db, team_id, "team_deleted", user_id, user_id)

            logger.info(f"Team deleted: {team_id} by user {user_id}")

    async def set_polar_customer_id(self, team_id: str, polar_customer_id: str) -> TeamSchema:
        """Persist a provider customer id (Polar) onto the team record.

        Returns the updated TeamSchema.
        """
        async with get_db_session() as db:
            team = await self.team_repository.get_by_id(db, team_id)
            if not team:
                raise NotFoundError("Team", team_id)

            if not safe_set_if_column_exists(team, "polar_customer_id", polar_customer_id):
                raise ValidationError("Team model does not expose `polar_customer_id`")

            updated = await self.team_repository.update(db, team)
            return self._to_team_schema(updated)

    async def invite_member(
        self,
        team_id: str,
        user_id: str,
        payload: InviteTeamMemberRequest,
    ) -> TeamMemberInfo:
        """Invite a user to team (admin or owner only)."""
        async with get_db_session() as db:
            requester = await self._get_membership(db, team_id, user_id)
            if (
                not requester
                or requester.status != TeamMemberStatus.ACTIVE.value
                or requester.role == TeamRole.VIEWER.value
            ):
                raise PermissionError("Only admins/owners can invite members")

            existing = await self.member_repository.get_by_team_and_user(db, team_id, payload.email)
            if existing and existing.status != TeamMemberStatus.REMOVED.value:
                raise ConflictError(f"User is already a member of team {team_id}")

            new_member = TeamMember(
                id=f"tmem_{uuid4().hex[:12]}",
                team_id=team_id,
                user_id=payload.email,
                role=payload.role,
                status=TeamMemberStatus.INVITED.value,
                invited_by=user_id,
                invited_at=datetime.utcnow(),
            )
            created = await self.member_repository.create(db, new_member)

            await self._log_event(
                db=db,
                team_id=team_id,
                event_type="member_invited",
                actor_id=user_id,
                subject_id=payload.email,
                payload={"role": payload.role},
            )

            logger.info(f"User {payload.email} invited to team {team_id} by {user_id}")
            return self._to_member_info(created, email=payload.email)

    async def update_member_role(
        self,
        team_id: str,
        member_id: str,
        user_id: str,
        payload: UpdateTeamMemberRequest,
    ) -> TeamMemberInfo:
        """Update member role (admin or owner only)."""
        async with get_db_session() as db:
            requester = await self._get_membership(db, team_id, user_id)
            if (
                not requester
                or requester.status != TeamMemberStatus.ACTIVE.value
                or requester.role == TeamRole.VIEWER.value
            ):
                raise PermissionError("Only admins/owners can update roles")

            member = await self.member_repository.get_by_id(db, member_id)
            if not member or member.team_id != team_id:
                raise NotFoundError("TeamMember", member_id)

            if member.role == TeamRole.OWNER.value and payload.role != TeamRole.OWNER.value:
                owners = await self.member_repository.get_by_role(db, team_id, TeamRole.OWNER.value)
                active_owner_count = len(
                    [owner for owner in owners if owner.status == TeamMemberStatus.ACTIVE.value]
                )
                if active_owner_count <= 1:
                    raise ValidationError("Cannot demote the last team owner")

            member.role = payload.role
            updated = await self.member_repository.update(db, member)

            await self._log_event(
                db=db,
                team_id=team_id,
                event_type="member_role_updated",
                actor_id=user_id,
                subject_id=member.user_id,
                payload={"new_role": payload.role},
            )

            logger.info(
                f"Member {member.user_id} role updated to {payload.role} in team {team_id}"
            )
            return self._to_member_info(updated)

    async def remove_member(self, team_id: str, member_id: str, user_id: str) -> None:
        """Remove a member from team (admin or owner only)."""
        async with get_db_session() as db:
            requester = await self._get_membership(db, team_id, user_id)
            if (
                not requester
                or requester.status != TeamMemberStatus.ACTIVE.value
                or requester.role == TeamRole.VIEWER.value
            ):
                raise PermissionError("Only admins/owners can remove members")

            member = await self.member_repository.get_by_id(db, member_id)
            if not member or member.team_id != team_id:
                raise NotFoundError("TeamMember", member_id)

            if member.role == TeamRole.OWNER.value:
                owners = await self.member_repository.get_by_role(db, team_id, TeamRole.OWNER.value)
                active_owner_count = len(
                    [owner for owner in owners if owner.status == TeamMemberStatus.ACTIVE.value]
                )
                if active_owner_count <= 1:
                    raise ValidationError("Cannot remove the last team owner")

            member.status = TeamMemberStatus.REMOVED.value
            await self.member_repository.update(db, member)
            await self._log_event(db, team_id, "member_removed", user_id, member.user_id)

            logger.info(f"Member {member.user_id} removed from team {team_id} by {user_id}")

    async def get_audit_log(self, team_id: str, user_id: str, limit: int = 100) -> list[dict]:
        """Get team audit log for active members."""
        async with get_db_session() as db:
            membership = await self._get_membership(db, team_id, user_id)
            if not membership or membership.status != TeamMemberStatus.ACTIVE.value:
                raise PermissionError(f"User not a member of team {team_id}")

            events = await self.event_repository.get_by_team(db, team_id, limit)
            return [
                {
                    "id": event.id,
                    "event_type": event.event_type,
                    "actor_id": event.actor_id,
                    "subject_id": event.subject_id,
                    "payload": event.payload,
                    "created_at": event.created_at.isoformat(),
                }
                for event in events
            ]


def get_team_service() -> TeamService:
    """Create a request-scoped TeamService."""
    return TeamService()


async def get_current_team(
    team_id: Optional[str] = Query(None),
    user_id: str = Depends(get_current_user),
    team_service: TeamService = Depends(get_team_service),
) -> str:
    """Resolve current team from explicit team_id or first active membership."""
    if team_id:
        membership = await team_service.get_membership(team_id, user_id)
        if not membership or membership.status != TeamMemberStatus.ACTIVE.value:
            raise HTTPException(status_code=403, detail="Not a member of that team")
        return team_id

    teams = await team_service.list_user_teams(user_id)
    if not teams:
        raise HTTPException(status_code=404, detail="No team found for user")
    return teams[0].id


__all__ = ["TeamService", "get_team_service", "get_current_team"]
