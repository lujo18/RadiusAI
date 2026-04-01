"""
User repository - handles all database queries for User entities
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.shared.base_repository import BaseRepository
from app.features.user.models import User


class UserRepository(BaseRepository[User]):
    """
    Repository for User ORM model

    Usage:
        repo = UserRepository(User)
        user = await repo.get_by_id(db, user_id)
        user = await repo.get_by_email(db, email)
    """

    def __init__(self, db: Optional[AsyncSession] = None, supabase=None):
        super().__init__(User, db=db, supabase=supabase)

    # ── Custom queries beyond base CRUD ─────────────────

    async def get_by_email(self, email: str) -> User | None:
        """Fetch user by email address"""
        session = self._ensure_db()
        stmt = select(User).where(User.email == email)
        result = await session.execute(stmt)
        return result.scalars().first()

    async def get_active_users(self, limit: int = 100) -> list[User]:
        """Fetch all active users"""
        session = self._ensure_db()
        stmt = select(User).where(User.is_active == True).limit(limit)
        result = await session.execute(stmt)
        return result.scalars().all()
