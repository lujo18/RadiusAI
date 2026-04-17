"""
Template Service - Business logic for template operations
"""

import logging
import uuid
from datetime import datetime
from typing import Optional

from app.core.database import get_db_session
from app.core.exceptions import NotFoundError, PermissionError as PermError
from app.features.templates.models import Template
from app.features.templates.schemas import TemplateCreate, TemplateUpdate
from app.features.templates.repository import TemplateRepository

logger = logging.getLogger(__name__)

class TemplateService:
    """Business logic for template operations."""

    def __init__(self, repository: Optional[TemplateRepository] = None):
        self.repository = repository or TemplateRepository()

    async def _get_template_or_raise(
        self, db, template_id: str, user_id: str | None = None
    ) -> Template:
        template = await self.repository.get_by_id(db, template_id)
        if not template:
            raise NotFoundError("Template", template_id)
        if user_id and template.user_id != user_id:
            raise PermError(f"User {user_id} does not own template {template_id}")
        return template

    async def create_template(
        self, user_id: str, brand_id: str, payload: TemplateCreate
    ) -> Template:
        """Create a new template for a brand."""
        async with get_db_session() as db:
            template_id = f"tmpl_{uuid.uuid4().hex[:12]}"
            template = Template(
                id=template_id,
                user_id=user_id,
                brand_id=brand_id,
                name=payload.name,
                description=payload.description,
                category=payload.category or "custom",
                style_config=payload.style_config,
                content_rules=payload.content_rules,
                is_default=payload.is_default or False,
                parent_id=payload.parent_id,
                tags=payload.tags or [],
            )
            created = await self.repository.create(db, template)
            logger.info(f"Template created: {template_id} for brand {brand_id}")
            return created

    async def get_template(
        self, template_id: str, user_id: str | None = None
    ) -> Template:
        """Get template by ID with optional user verification."""
        async with get_db_session() as db:
            return await self._get_template_or_raise(db, template_id, user_id)

    async def list_brand_templates(
        self, brand_id: str, user_id: str | None = None
    ) -> list[Template]:
        """Get all templates for a brand."""
        async with get_db_session() as db:
            templates = await self.repository.get_by_brand(db, brand_id)
            logger.debug(f"Listed {len(templates)} templates for brand {brand_id}")
            return templates

    async def list_user_templates(self, user_id: str) -> list[Template]:
        """Get all templates created by a user."""
        async with get_db_session() as db:
            templates = await self.repository.get_by_user(db, user_id)
            logger.debug(f"Listed {len(templates)} templates for user {user_id}")
            return templates

    async def list_favorite_templates(self, user_id: str) -> list[Template]:
        """Get user's favorite templates."""
        async with get_db_session() as db:
            templates = await self.repository.get_favorites(db, user_id)
            logger.debug(f"Listed {len(templates)} favorite templates for user {user_id}")
            return templates

    async def update_template(
        self,
        template_id: str,
        payload: TemplateUpdate,
        user_id: str | None = None,
    ) -> Template:
        """Update template details."""
        async with get_db_session() as db:
            template = await self._get_template_or_raise(db, template_id, user_id)
            update_data = payload.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(template, field, value)
            template.updated_at = datetime.utcnow()
            updated = await self.repository.update(db, template)
            logger.info(f"Template updated: {template_id}")
            return updated

    async def toggle_favorite(
        self, template_id: str, is_favorite: bool, user_id: str | None = None
    ) -> Template:
        """Toggle template favorite status."""
        async with get_db_session() as db:
            template = await self._get_template_or_raise(db, template_id, user_id)
            template.favorite = is_favorite
            updated = await self.repository.update(db, template)
            logger.debug(f"Template {template_id} favorite: {is_favorite}")
            return updated

    async def delete_template(
        self, template_id: str, user_id: str | None = None
    ) -> None:
        """Delete a template."""
        async with get_db_session() as db:
            template = await self._get_template_or_raise(db, template_id, user_id)
            await self.repository.delete(db, template.id)
            logger.info(f"Template deleted: {template_id}")

    async def search_by_category(self, category: str, user_id: str) -> list[Template]:
        """Search templates by category."""
        async with get_db_session() as db:
            templates = await self.repository.get_by_category(db, category, user_id)
            logger.debug(f"Found {len(templates)} templates in category '{category}'")
            return templates

    async def search_by_tags(self, tags: list[str], user_id: str) -> list[Template]:
        """Search templates by tags."""
        async with get_db_session() as db:
            templates = await self.repository.search_by_tags(db, tags, user_id)
            logger.debug(f"Found {len(templates)} templates with tags: {tags}")
            return templates

    async def get_default_templates(self) -> list[Template]:
        """Get system default templates available to all users."""
        async with get_db_session() as db:
            templates = await self.repository.get_defaults(db)
            logger.debug(f"Retrieved {len(templates)} default templates")
            return templates


def get_template_service() -> TemplateService:
    """Create a request-scoped template service."""
    return TemplateService()


__all__ = ["TemplateService", "get_template_service"]
