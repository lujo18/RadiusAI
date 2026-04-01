"""
Team Repository - Data access for teams, members, and events.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, func
from typing import Optional
from uuid import uuid4

from app.shared.base_repository import BaseRepository
from app.features.team.models import (
    Team,
    TeamMember,
    TeamEvent,
    TeamRole,
    TeamMemberStatus,
)


class TeamRepository(BaseRepository[Team]):
    """Repository for Team ORM operations."""

    def __init__(self, db: Optional[AsyncSession] = None, supabase=None):
        super().__init__(Team, db=db, supabase=supabase)

    async def get_by_owner(self, owner_id: str) -> list[Team]:
        """Get all teams owned by a user."""
        stmt = select(Team).where(Team.owner_id == owner_id)
        session = self._ensure_db()
        result = await session.execute(stmt)
        return result.scalars().all()

    async def get_by_slug(self, slug: str) -> Optional[Team]:
        """Get team by slug."""
        stmt = select(Team).where(Team.slug == slug)
        session = self._ensure_db()
        result = await session.execute(stmt)
        return result.scalars().first()

    async def get_user_teams(self, user_id: str) -> list[Team]:
        """Get all teams a user is a member of."""
        stmt = (
            select(Team)
            .join(TeamMember)
            .where(TeamMember.user_id == user_id)
            .where(TeamMember.status == TeamMemberStatus.ACTIVE.value)
            .distinct()
        )
        session = self._ensure_db()
        result = await session.execute(stmt)
        return result.scalars().all()


class TeamMemberRepository(BaseRepository[TeamMember]):
    """Repository for TeamMember ORM operations."""

    def __init__(self, db: Optional[AsyncSession] = None, supabase=None):
        super().__init__(TeamMember, db=db, supabase=supabase)

    async def get_by_team(self, team_id: str) -> list[TeamMember]:
        """Get all members in a team."""
        stmt = select(TeamMember).where(TeamMember.team_id == team_id)
        session = self._ensure_db()
        result = await session.execute(stmt)
        return result.scalars().all()

    async def get_by_team_and_user(self, team_id: str, user_id: str) -> Optional[TeamMember]:
        """Get a user's membership in a specific team."""
        stmt = select(TeamMember).where(
            and_(TeamMember.team_id == team_id, TeamMember.user_id == user_id)
        )
        session = self._ensure_db()
        result = await session.execute(stmt)
        return result.scalars().first()

    async def get_by_role(self, team_id: str, role: str) -> list[TeamMember]:
        """Get all members with a specific role in team."""
        stmt = select(TeamMember).where(
            and_(TeamMember.team_id == team_id, TeamMember.role == role)
        )
        session = self._ensure_db()
        result = await session.execute(stmt)
        return result.scalars().all()

    async def get_by_status(self, team_id: str, status: str) -> list[TeamMember]:
        """Get all members with a specific status in team."""
        stmt = select(TeamMember).where(
            and_(TeamMember.team_id == team_id, TeamMember.status == status)
        )
        session = self._ensure_db()
        result = await session.execute(stmt)
        return result.scalars().all()

    async def get_team_owner(self, team_id: str) -> Optional[TeamMember]:
        """Get the owner member of a team."""
        stmt = (
            select(TeamMember)
            .where(
                and_(
                    TeamMember.team_id == team_id,
                    TeamMember.role == TeamRole.OWNER.value,
                )
            )
            .limit(1)
        )
        session = self._ensure_db()
        result = await session.execute(stmt)
        return result.scalars().first()

    async def count_members(self, team_id: str) -> int:
        """Count active members in team."""
        stmt = select(func.count(TeamMember.id)).where(
            and_(
                TeamMember.team_id == team_id,
                TeamMember.status == TeamMemberStatus.ACTIVE.value,
            )
        )
        session = self._ensure_db()
        result = await session.execute(stmt)
        return result.scalar() or 0


class TeamEventRepository(BaseRepository[TeamEvent]):
    """Repository for TeamEvent audit log operations."""

    def __init__(self, db: Optional[AsyncSession] = None, supabase=None):
        super().__init__(TeamEvent, db=db, supabase=supabase)

    async def get_by_team(self, team_id: str, limit: int = 100) -> list[TeamEvent]:
        """Get recent events for a team (audit log)."""
        stmt = (
            select(TeamEvent)
            .where(TeamEvent.team_id == team_id)
            .order_by(desc(TeamEvent.created_at))
            .limit(limit)
        )
        session = self._ensure_db()
        result = await session.execute(stmt)
        return result.scalars().all()

    async def get_by_type(self, team_id: str, event_type: str) -> list[TeamEvent]:
        """Get events of a specific type for a team."""
        stmt = (
            select(TeamEvent)
            .where(
                and_(TeamEvent.team_id == team_id, TeamEvent.event_type == event_type)
            )
            .order_by(desc(TeamEvent.created_at))
        )
        session = self._ensure_db()
        result = await session.execute(stmt)
        return result.scalars().all()


# Module-level singletons
team_repo = TeamRepository()
members_repo = TeamMemberRepository()
events_repo = TeamEventRepository()
