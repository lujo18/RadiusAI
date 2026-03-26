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
    
    def __init__(self, model: Type[ModelType]):
        self.model = model
    
    async def get_by_id(self, db: AsyncSession, id: any) -> Optional[ModelType]:
        """Fetch entity by primary key"""
        return await db.get(self.model, id)
    
    async def get_all(
        self, 
        db: AsyncSession, 
        limit: int = 100, 
        offset: int = 0
    ) -> List[ModelType]:
        """Fetch all entities with pagination"""
        stmt = select(self.model).limit(limit).offset(offset)
        result = await db.execute(stmt)
        return result.scalars().all()
    
    async def create(self, db: AsyncSession, obj: ModelType) -> ModelType:
        """Create and persist a new entity"""
        db.add(obj)
        await db.commit()
        await db.refresh(obj)
        return obj
    
    async def update(self, db: AsyncSession, obj: ModelType) -> ModelType:
        """Update and persist an existing entity"""
        await db.merge(obj)
        await db.commit()
        # Refresh to get updated values
        await db.refresh(obj)
        return obj
    
    async def delete(self, db: AsyncSession, id: any) -> None:
        """Delete entity by primary key"""
        obj = await self.get_by_id(db, id)
        if obj:
            await db.delete(obj)
            await db.commit()

