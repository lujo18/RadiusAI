"""
Template Repository - Data access layer for templates
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
import logging

from app.shared.base_repository import BaseRepository
from app.features.templates.models import Template

logger = logging.getLogger(__name__)


class TemplateRepository(BaseRepository[Template]):
    """
    Template data access layer.

    Provides CRUD operations and custom queries for templates,
    with brand/user scoping for data isolation.
    """

    def __init__(self, db: Optional[AsyncSession] = None, supabase=None):
        super().__init__(Template, db=db, supabase=supabase)

    # ═════════ Custom Queries ═════════

    async def get_by_brand(self, brand_id: str, limit: int = 100) -> list[Template]:
        """Get all templates for a brand"""
        session = self._ensure_db()
        stmt = select(Template).where(Template.brand_id == brand_id).limit(limit)
        result = await session.execute(stmt)
        return result.scalars().all()

    async def get_by_user(self, user_id: str, limit: int = 100) -> list[Template]:
        """Get all templates created by a user"""
        session = self._ensure_db()
        stmt = select(Template).where(Template.user_id == user_id).limit(limit)
        result = await session.execute(stmt)
        return result.scalars().all()

    async def get_defaults(self, limit: int = 50) -> list[Template]:
        """Get default/system templates available to all users"""
        session = self._ensure_db()
        stmt = (
            select(Template)
            .where(Template.is_default == True)
            .where(Template.status == "active")
            .limit(limit)
        )
        result = await session.execute(stmt)
        return result.scalars().all()

    async def get_by_category(self, category: str, user_id: str, limit: int = 50) -> list[Template]:
        """Get templates in a specific category for a user"""
        session = self._ensure_db()
        stmt = (
            select(Template)
            .where(and_(Template.category == category, Template.user_id == user_id))
            .limit(limit)
        )
        result = await session.execute(stmt)
        return result.scalars().all()

    async def search_by_tags(self, tags: list[str], user_id: str, limit: int = 50) -> list[Template]:
        """Search templates by tags (partial match)"""
        session = self._ensure_db()
        stmt = (
            select(Template)
            .where(
                and_(
                    Template.user_id == user_id,
                    Template.tags.contains(tags),  # JSON contains operator
                )
            )
            .limit(limit)
        )
        result = await session.execute(stmt)
        return result.scalars().all()

    async def mark_as_favorite(self, template_id: str, is_favorite: bool = True) -> Template:
        """Toggle template favorite status"""
        template = await self.get_by_id(template_id)
        if not template:
            return None

        template.favorite = is_favorite
        session = self._ensure_db()
        session.add(template)
        await session.flush()
        return template

    async def get_favorites(self, user_id: str, limit: int = 50) -> list[Template]:
        """Get user's favorite templates"""
        session = self._ensure_db()
        stmt = (
            select(Template)
            .where(and_(Template.user_id == user_id, Template.favorite == True))
            .limit(limit)
        )
        result = await session.execute(stmt)
        return result.scalars().all()

    async def delete_by_id(self, template_id: str) -> bool:
        """Delete template by ID"""
        template = await self.get_by_id(template_id)
        if not template:
            return False

        session = self._ensure_db()
        await session.delete(template)
        await session.flush()
        return True
