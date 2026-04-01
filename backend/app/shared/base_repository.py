"""
Generic base repository for all ORM-based repositories

Provides common CRUD operations for SQLAlchemy models.
Subclasses should override for custom queries.
"""

from typing import Generic, TypeVar, Type, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """
    Generic repository for SQLAlchemy ORM models

    Usage:
        class UserRepository(BaseRepository[User]):
            async def get_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
                stmt = select(User).where(User.email == email)
                result = await db.execute(stmt)
                return result.scalars().first()
    """

    def __init__(self, model: Type[ModelType], db: Optional[AsyncSession] = None, supabase=None):
        self.model = model
        # SQLAlchemy session (optional). Pass an AsyncSession per-request when constructing repos.
        self.db: Optional[AsyncSession] = db
        # Supabase client for storage/analytics (optional)
        self.supabase = supabase

    def _ensure_db(self) -> AsyncSession:
        if not self.db:
            raise RuntimeError("Repository requires an AsyncSession; pass it to the constructor")
        return self.db
       

    async def get_by_id(self, id: any) -> Optional[ModelType]:
        """Fetch entity by primary key"""
        session = self._ensure_db()
        return await session.get(self.model, id)

    async def get_all(self, limit: int = 100, offset: int = 0) -> List[ModelType]:
        """Fetch all entities with pagination"""
        session = self._ensure_db()
        stmt = select(self.model).limit(limit).offset(offset)
        result = await session.execute(stmt)
        return result.scalars().all()

    async def create(self, obj: ModelType) -> ModelType:
        """Create and persist a new entity"""
        session = self._ensure_db()
        session.add(obj)
        await session.commit()
        await session.refresh(obj)
        return obj

    async def update(self, obj: ModelType) -> ModelType:
        """Update and persist an existing entity"""
        session = self._ensure_db()
        await session.merge(obj)
        await session.commit()
        # Refresh to get updated values
        await session.refresh(obj)
        return obj

    async def delete(self, id: any) -> None:
        """Delete entity by primary key"""
        session = self._ensure_db()
        obj = await session.get(self.model, id)
        if obj:
            await session.delete(obj)
            await session.commit()
