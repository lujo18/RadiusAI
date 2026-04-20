"""
Template Repository - Data access layer for templates
"""

from sqlalchemy import select, and_
import logging
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.base_repository import BaseRepository
from app.features.templates.models import Template

logger = logging.getLogger(__name__)


class TemplateRepository(BaseRepository[Template]):
    """
    Template data access layer.

    Provides CRUD operations and custom queries for templates,
    with brand/user scoping for data isolation.
    """

    def __init__(self, supabase=None):
        super().__init__(Template, supabase=supabase)

    # ═════════ Custom Queries ═════════

    async def get_by_brand(
        self, db: AsyncSession, brand_id: str, limit: int = 100
    ) -> list[Template]:
        """Get all templates for a brand"""
        stmt = select(Template).where(Template.brand_id == brand_id).limit(limit)
        result = await db.execute(stmt)
        return result.scalars().all()

    async def get_by_user(
        self, db: AsyncSession, user_id: str, limit: int = 100
    ) -> list[Template]:
        """Get all templates created by a user"""
        stmt = select(Template).where(Template.user_id == user_id).limit(limit)
        result = await db.execute(stmt)
        return result.scalars().all()

    async def get_defaults(self, db: AsyncSession, limit: int = 50) -> list[Template]:
        """Get default/system templates available to all users"""
        stmt = (
            select(Template)
            .where(Template.is_default == True)
            .where(Template.status == "active")
            .limit(limit)
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    async def get_by_category(
        self,
        db: AsyncSession,
        category: str,
        user_id: str,
        limit: int = 50,
    ) -> list[Template]:
        """Get templates in a specific category for a user"""
        stmt = (
            select(Template)
            .where(and_(Template.category == category, Template.user_id == user_id))
            .limit(limit)
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    async def search_by_tags(
        self,
        db: AsyncSession,
        tags: list[str],
        user_id: str,
        limit: int = 50,
    ) -> list[Template]:
        """Search templates by tags (partial match)"""
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
        result = await db.execute(stmt)
        return result.scalars().all()

    async def mark_as_favorite(
        self, db: AsyncSession, template_id: str, is_favorite: bool = True
    ) -> Template:
        """Toggle template favorite status"""
        template = await db.get(Template, template_id)
        if not template:
            return None

        template.favorite = is_favorite
        db.add(template)
        await db.flush()
        return template

    async def get_favorites(
        self, db: AsyncSession, user_id: str, limit: int = 50
    ) -> list[Template]:
        """Get user's favorite templates"""
        stmt = (
            select(Template)
            .where(and_(Template.user_id == user_id, Template.favorite == True))
            .limit(limit)
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    async def delete_by_id(self, db: AsyncSession, template_id: str) -> bool:
        """Delete template by ID"""
        template = await db.get(Template, template_id)
        if not template:
            return False

        await db.delete(template)
        await db.flush()
        return True
