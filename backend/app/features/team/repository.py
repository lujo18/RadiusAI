"""
Team Repository - Data access for teams, members, and events.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, func, cast, String
from typing import Optional

from app.shared.base_repository import BaseRepository
from app.features.team.models import (
    Team,
    TeamMember,
    TeamEvent,
    TeamRole,
    TeamMemberStatus,
)
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.orm import load_only
from app.core.db_safety import is_missing_column_error


class TeamRepository(BaseRepository[Team]):
    """Repository for Team ORM operations."""

    # Cache whether `team_metadata` is queryable in this runtime DB schema.
    _team_metadata_available: Optional[bool] = None

    def __init__(self, supabase=None):
        super().__init__(Team, supabase=supabase)

    @classmethod
    def _team_columns(cls, include_metadata: bool = True):
        cols = [
            Team.id,
            Team.owner_id,
            Team.name,
            Team.slug,
            Team.description,
            Team.avatar_url,
            Team.polar_customer_id,
            Team.created_at,
            Team.updated_at,
            Team.deleted_at,
        ]
        if include_metadata:
            cols.insert(7, Team.team_metadata)
        return tuple(cols)

    async def get_by_id(self, db: AsyncSession, id: str) -> Optional[Team]:
        """Fetch team by id with schema-drift-safe fallback.

        Avoids `SELECT *` and retries without `team_metadata` if that column
        does not exist in older database schemas.
        """
        include_metadata = self._team_metadata_available is not False

        stmt = (
            select(Team)
            .options(load_only(*self._team_columns(include_metadata=include_metadata)))
            .where(cast(Team.id, String) == str(id))
        )

        try:
            result = await db.execute(stmt)
            return result.scalars().first()
        except ProgrammingError as exc:
            if not include_metadata or not is_missing_column_error(exc):
                raise

            # Cache this so future calls skip the failing column directly.
            self._team_metadata_available = False
            try:
                await db.rollback()
            except Exception:
                pass

            retry_stmt = (
                select(Team)
                .options(load_only(*self._team_columns(include_metadata=False)))
                .where(cast(Team.id, String) == str(id))
            )
            result = await db.execute(retry_stmt)
            return result.scalars().first()

    async def get_by_owner(self, db: AsyncSession, owner_id: str) -> list[Team]:
        """Get all teams owned by a user."""
        include_metadata = self._team_metadata_available is not False
        stmt = (
            select(Team)
            .options(load_only(*self._team_columns(include_metadata=include_metadata)))
            .where(Team.owner_id == owner_id)
        )
        try:
            result = await db.execute(stmt)
            return list(result.scalars().all())
        except ProgrammingError as exc:
            if not include_metadata or not is_missing_column_error(exc):
                raise
            self._team_metadata_available = False
            try:
                await db.rollback()
            except Exception:
                pass
            retry_stmt = (
                select(Team)
                .options(load_only(*self._team_columns(include_metadata=False)))
                .where(Team.owner_id == owner_id)
            )
            result = await db.execute(retry_stmt)
            return list(result.scalars().all())

    async def get_by_slug(self, db: AsyncSession, slug: str) -> Optional[Team]:
        """Get team by slug."""
        include_metadata = self._team_metadata_available is not False
        stmt = (
            select(Team)
            .options(load_only(*self._team_columns(include_metadata=include_metadata)))
            .where(Team.slug == slug)
        )
        try:
            result = await db.execute(stmt)
            return result.scalars().first()
        except ProgrammingError as exc:
            if not include_metadata or not is_missing_column_error(exc):
                raise
            self._team_metadata_available = False
            try:
                await db.rollback()
            except Exception:
                pass
            retry_stmt = (
                select(Team)
                .options(load_only(*self._team_columns(include_metadata=False)))
                .where(Team.slug == slug)
            )
            result = await db.execute(retry_stmt)
            return result.scalars().first()
    
    async def update_team(self, db: AsyncSession, team_id: str, **kwargs) -> Optional[Team]:
        """Update team fields by id."""
        stmt = select(Team).where(cast(Team.id, String) == str(team_id))
        result = await db.execute(stmt)
        team = result.scalars().first()

        if not team:
            return None

        for key, value in kwargs.items():
            if hasattr(team, key):
                setattr(team, key, value)

        db.add(team)
        await db.flush()
        await db.refresh(team)
        return team

    async def get_user_teams(self, db: AsyncSession, user_id: str) -> list[dict]:
        """Get team ids for all teams a user is a member of.

        To avoid selecting missing or optional columns from the `teams` table
        (for example `team_settings` which may not exist in older schemas),
        this method selects only the `id` column and returns a list of simple
        dicts: `[{"id": <team_id>}, ...]`.

        Callers should access the id with `team.get("id")` or
        `getattr(team, "id", None)`.
        """
        stmt = (
            select(Team.id)
            .join(TeamMember)
            .where(cast(TeamMember.user_id, String) == user_id)
            .where(TeamMember.status == TeamMemberStatus.ACTIVE.value)
            .distinct()
        )
        result = await db.execute(stmt)
        rows = result.scalars().all()
        # Normalize to list of dicts with `id` key to keep callers consistent
        # and ensure IDs are plain strings to avoid type-mismatch later.
        return [{"id": str(r)} for r in rows]


class TeamMemberRepository(BaseRepository[TeamMember]):
    """Repository for TeamMember ORM operations."""

    def __init__(self, supabase=None):
        super().__init__(TeamMember, supabase=supabase)

    @staticmethod
    def _member_columns():
        return (
            TeamMember.id,
            TeamMember.team_id,
            TeamMember.user_id,
            TeamMember.role,
            TeamMember.status,
            TeamMember.invited_by,
            TeamMember.invited_at,
            TeamMember.accepted_at,
            TeamMember.created_at,
            TeamMember.updated_at,
        )

    async def get_by_team(self, db: AsyncSession, team_id: str) -> list[TeamMember]:
        """Get all members in a team."""
        stmt = (
            select(TeamMember)
            .options(load_only(*self._member_columns()))
            .where(TeamMember.team_id == team_id)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_team_and_user(
        self, db: AsyncSession, team_id: str, user_id: str
    ) -> Optional[TeamMember]:
        """Get a user's membership in a specific team.
        """
        stmt = (
            select(TeamMember)
            .options(load_only(*self._member_columns()))
            .where(and_(TeamMember.team_id == team_id, TeamMember.user_id == user_id))
        )
        result = await db.execute(stmt)
        return result.scalars().first()

    async def get_by_role(
        self, db: AsyncSession, team_id: str, role: str
    ) -> list[TeamMember]:
        """Get all members with a specific role in team."""
        stmt = (
            select(TeamMember)
            .options(load_only(*self._member_columns()))
            .where(and_(TeamMember.team_id == team_id, TeamMember.role == role))
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_status(
        self, db: AsyncSession, team_id: str, status: str
    ) -> list[TeamMember]:
        """Get all members with a specific status in team."""
        stmt = (
            select(TeamMember)
            .options(load_only(*self._member_columns()))
            .where(and_(TeamMember.team_id == team_id, TeamMember.status == status))
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_team_owner(self, db: AsyncSession, team_id: str) -> Optional[TeamMember]:
        """Get the owner member of a team."""
        stmt = (
            select(TeamMember)
            .options(load_only(*self._member_columns()))
            .where(
                and_(
                    TeamMember.team_id == team_id,
                    TeamMember.role == TeamRole.OWNER.value,
                )
            )
            .limit(1)
        )
        result = await db.execute(stmt)
        return result.scalars().first()

    async def count_members(self, db: AsyncSession, team_id: str) -> int:
        """Count active members in team."""
        stmt = select(func.count(TeamMember.id)).where(
            and_(
                TeamMember.team_id == team_id,
                TeamMember.status == TeamMemberStatus.ACTIVE.value,
            )
        )
        result = await db.execute(stmt)
        return result.scalar() or 0


class TeamEventRepository(BaseRepository[TeamEvent]):
    """Repository for TeamEvent audit log operations."""

    def __init__(self, supabase=None):
        super().__init__(TeamEvent, supabase=supabase)

    async def get_by_team(
        self, db: AsyncSession, team_id: str, limit: int = 100
    ) -> list[TeamEvent]:
        """Get recent events for a team (audit log)."""
        stmt = (
            select(TeamEvent)
            .where(TeamEvent.team_id == team_id)
            .order_by(desc(TeamEvent.created_at))
            .limit(limit)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_type(
        self, db: AsyncSession, team_id: str, event_type: str
    ) -> list[TeamEvent]:
        """Get events of a specific type for a team."""
        stmt = (
            select(TeamEvent)
            .where(and_(TeamEvent.team_id == team_id, TeamEvent.event_type == event_type))
            .order_by(desc(TeamEvent.created_at))
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

__all__ = ["TeamRepository", "TeamMemberRepository", "TeamEventRepository"]

# Compatibility shim: some modules and tests import a module-level `members_repo`
# that previously accepted a `db` session as the first parameter. Provide a
# thin adapter that preserves the legacy call signature while delegating to
# the new request-scoped repository implementation.
class _MembersRepoCompat:
    async def get_by_team_and_user(self, db: AsyncSession, team_id: str, user_id: str):
        repo = TeamMemberRepository()
        return await repo.get_by_team_and_user(db, team_id, user_id)

    async def get_by_team(self, db: AsyncSession, team_id: str):
        repo = TeamMemberRepository()
        return await repo.get_by_team(db, team_id)

    async def get_by_role(self, db: AsyncSession, team_id: str, role: str):
        repo = TeamMemberRepository()
        return await repo.get_by_role(db, team_id, role)

    async def get_by_status(self, db: AsyncSession, team_id: str, status: str):
        repo = TeamMemberRepository()
        return await repo.get_by_status(db, team_id, status)

    async def get_team_owner(self, db: AsyncSession, team_id: str):
        repo = TeamMemberRepository()
        return await repo.get_team_owner(db, team_id)

    async def count_members(self, db: AsyncSession, team_id: str):
        repo = TeamMemberRepository()
        return await repo.count_members(db, team_id)


# Export the compatibility object for legacy imports
members_repo = _MembersRepoCompat()

__all__.append("members_repo")
