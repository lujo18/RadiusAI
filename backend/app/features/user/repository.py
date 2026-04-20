"""
User repository - handles all database queries for User entities
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.base_repository import BaseRepository
from app.features.user.models import User


class UserRepository(BaseRepository[User]):
    """
    Repository for User ORM model

    Usage:
        repo = UserRepository(session)
        user = await repo.get_by_id(user_id)
        user = await repo.get_by_email(email)
    """

    def __init__(self, supabase=None):
        super().__init__(User, supabase=supabase)

    # ── Custom queries beyond base CRUD ─────────────────

    async def get_by_email(self, db: AsyncSession, email: str) -> User | None:
        """Fetch user by email address"""
        stmt = select(User).where(User.email == email)
        result = await db.execute(stmt)
        return result.scalars().first()

    async def get_active_users(self, db: AsyncSession, limit: int = 100) -> list[User]:
        """Fetch all active users"""
        stmt = select(User).where(User.is_active == True).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())
