"""
Template Service - Business logic for template operations
"""

import logging
import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, PermissionError as PermError
from app.features.templates.models import Template
from app.features.templates.schemas import TemplateCreate, TemplateUpdate
from app.features.templates.repository import TemplateRepository

logger = logging.getLogger(__name__)

repository = TemplateRepository()


# ═════════════════════════════════════════════════
#  CRUD Operations
# ═════════════════════════════════════════════════

async def create_template(
    db: AsyncSession,
    user_id: str,
    brand_id: str,
    payload: TemplateCreate
) -> Template:
    """
    Create a new template for a brand.
    
    Args:
        db: Database session
        user_id: User creating the template (for ownership)
        brand_id: Brand this template belongs to
        payload: Template data to create
    
    Returns:
        Created Template object
    """
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
    
    created = await repository.create(db, template)
    logger.info(f"Template created: {template_id} for brand {brand_id}")
    return created


async def get_template(
    db: AsyncSession,
    template_id: str,
    user_id: str | None = None
) -> Template:
    """
    Get template by ID with optional user verification.
    
    Args:
        db: Database session
        template_id: Template ID to retrieve
        user_id: If provided, verify user owns the template
    
    Returns:
        Template object
    
    Raises:
        NotFoundError: If template doesn't exist
        PermError: If user_id provided and doesn't own template
    """
    template = await repository.get_by_id(db, template_id)
    
    if not template:
        raise NotFoundError(f"Template {template_id} not found")
    
    if user_id and template.user_id != user_id:
        raise PermError(f"User {user_id} does not own template {template_id}")
    
    return template


async def list_brand_templates(
    db: AsyncSession,
    brand_id: str,
    user_id: str | None = None
) -> list[Template]:
    """
    Get all templates for a brand.
    
    Args:
        db: Database session
        brand_id: Brand to list templates for
        user_id: If provided, verify user can access brand (RLS hint for future)
    
    Returns:
        List of Template objects
    """
    templates = await repository.get_by_brand(db, brand_id)
    logger.debug(f"Listed {len(templates)} templates for brand {brand_id}")
    return templates


async def list_user_templates(
    db: AsyncSession,
    user_id: str
) -> list[Template]:
    """
    Get all templates created by a user.
    
    Args:
        db: Database session
        user_id: User to list templates for
    
    Returns:
        List of Template objects
    """
    templates = await repository.get_by_user(db, user_id)
    logger.debug(f"Listed {len(templates)} templates for user {user_id}")
    return templates


async def list_favorite_templates(
    db: AsyncSession,
    user_id: str
) -> list[Template]:
    """Get user's favorite templates"""
    templates = await repository.get_favorites(db, user_id)
    logger.debug(f"Listed {len(templates)} favorite templates for user {user_id}")
    return templates


async def update_template(
    db: AsyncSession,
    template_id: str,
    payload: TemplateUpdate,
    user_id: str | None = None
) -> Template:
    """
    Update template details.
    
    Args:
        db: Database session
        template_id: Template ID to update
        payload: Fields to update (partial update allowed)
        user_id: If provided, verify user owns template
    
    Returns:
        Updated Template object
    
    Raises:
        NotFoundError: If template doesn't exist
        PermError: If user_id provided and doesn't own template
    """
    template = await get_template(db, template_id, user_id)
    
    # Update only provided fields
    update_data = payload.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(template, field, value)
    
    template.updated_at = datetime.utcnow()
    
    updated = await repository.update(db, template)
    logger.info(f"Template updated: {template_id}")
    return updated


async def toggle_favorite(
    db: AsyncSession,
    template_id: str,
    is_favorite: bool,
    user_id: str | None = None
) -> Template:
    """Toggle template favorite status"""
    template = await get_template(db, template_id, user_id)
    template.favorite = is_favorite
    updated = await repository.update(db, template)
    logger.debug(f"Template {template_id} favorite: {is_favorite}")
    return updated


async def delete_template(
    db: AsyncSession,
    template_id: str,
    user_id: str | None = None
) -> None:
    """
    Delete a template.
    
    Args:
        db: Database session
        template_id: Template ID to delete
        user_id: If provided, verify user owns template
    
    Raises:
        NotFoundError: If template doesn't exist
        PermError: If user doesn't own template
    """
    template = await get_template(db, template_id, user_id)
    await repository.delete(db, template)
    logger.info(f"Template deleted: {template_id}")


# ═════════════════════════════════════════════════
#  Search Operations
# ═════════════════════════════════════════════════

async def search_by_category(
    db: AsyncSession,
    category: str,
    user_id: str
) -> list[Template]:
    """Search templates by category"""
    templates = await repository.get_by_category(db, category, user_id)
    logger.debug(f"Found {len(templates)} templates in category '{category}'")
    return templates


async def search_by_tags(
    db: AsyncSession,
    tags: list[str],
    user_id: str
) -> list[Template]:
    """Search templates by tags"""
    templates = await repository.search_by_tags(db, tags, user_id)
    logger.debug(f"Found {len(templates)} templates with tags: {tags}")
    return templates


async def get_default_templates(
    db: AsyncSession
) -> list[Template]:
    """Get system default templates available to all users"""
    templates = await repository.get_defaults(db)
    logger.debug(f"Retrieved {len(templates)} default templates")
    return templates
