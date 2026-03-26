"""
Post Repository - Data access layer for posts
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
import logging

from app.shared.base_repository import BaseRepository
from app.features.posts.models import Post

logger = logging.getLogger(__name__)


class PostRepository(BaseRepository[Post]):
    """Post data access layer with brand/platform scoping"""
    
    def __init__(self):
        super().__init__(Post)
    
    
    async def get_by_brand(
        self, 
        db: AsyncSession, 
        brand_id: str, 
        limit: int = 50
    ) -> list[Post]:
        """Get all posts for a brand"""
        stmt = (
            select(Post)
            .where(Post.brand_id == brand_id)
            .order_by(desc(Post.created_at))
            .limit(limit)
        )
        result = await db.execute(stmt)
        return result.scalars().all()
    
    
    async def get_by_template(
        self, 
        db: AsyncSession, 
        template_id: str, 
        limit: int = 50
    ) -> list[Post]:
        """Get all posts using a specific template"""
        stmt = (
            select(Post)
            .where(Post.template_id == template_id)
            .order_by(desc(Post.created_at))
            .limit(limit)
        )
        result = await db.execute(stmt)
        return result.scalars().all()
    
    
    async def get_by_status(
        self, 
        db: AsyncSession, 
        brand_id: str,
        status: str, 
        limit: int = 50
    ) -> list[Post]:
        """Get posts by status for a brand"""
        stmt = (
            select(Post)
            .where(and_(
                Post.brand_id == brand_id,
                Post.status == status
            ))
            .order_by(desc(Post.created_at))
            .limit(limit)
        )
        result = await db.execute(stmt)
        return result.scalars().all()
    
    
    async def get_scheduled_posts(
        self,
        db: AsyncSession,
        brand_id: str,
        limit: int = 50
    ) -> list[Post]:
        """Get scheduled posts for a brand"""
        stmt = (
            select(Post)
            .where(and_(
                Post.brand_id == brand_id,
                Post.status == "scheduled"
            ))
            .order_by(Post.scheduled_time)
            .limit(limit)
        )
        result = await db.execute(stmt)
        return result.scalars().all()
    
    
    async def get_by_variant_set(
        self,
        db: AsyncSession,
        variant_set_id: str,
        limit: int = 50
    ) -> list[Post]:
        """Get posts in a variant set (A/B testing)"""
        stmt = (
            select(Post)
            .where(Post.variant_set_id == variant_set_id)
            .order_by(desc(Post.created_at))
            .limit(limit)
        )
        result = await db.execute(stmt)
        return result.scalars().all()


    async def delete_by_id(
        self,
        db: AsyncSession,
        post_id: str
    ) -> bool:
        """Delete post by ID"""
        post = await self.get_by_id(db, post_id)
        if not post:
            return False
        await db.delete(post)
        await db.flush()
        return True
