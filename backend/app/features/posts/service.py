"""
Post Service - Business logic for post operations and generation
"""

import logging
import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    NotFoundError,
    PermissionError as PermError,
    ValidationError,
)
from app.features.posts.models import Post, PostStatus, PostPlatform
from app.features.posts.schemas import PostCreate, PostUpdate
from app.features.posts.repository import PostRepository
from app.features.generate.service import generate_service

logger = logging.getLogger(__name__)

repository = PostRepository()


# ═════════════════════════════════════════════════
#  Generation Orchestration
# ═════════════════════════════════════════════════


async def generate_posts(
    db: AsyncSession,
    user_id: str,
    brand_id: str,
    template_id: str,
    topic: str,
    count: int = 1,
    platform: str = "instagram",
    scheduled_time: datetime | None = None,
    variant_set_id: str | None = None,
) -> list[Post]:
    """
    Generate posts using AI.

    Args:
        db: Database session
        user_id: User requesting generation
        brand_id: Brand to generate for
        template_id: Template to use for structure
        topic: Content topic
        count: Number of variations
        platform: Target platform
        scheduled_time: Optional scheduling time
        variant_set_id: Optional A/B test set ID

    Returns:
        List of created Post objects

    Raises:
        ValidationError: If inputs invalid
        NotFoundError: If template not found
    """

    if count < 1 or count > 10:
        raise ValidationError("Count must be 1-10 for generation")

    # TODO: Fetch template from DB to validate and get structure
    # template = await template_service.get_template(db, template_id, user_id)
    # if not template:
    #     raise NotFoundError(f"Template {template_id} not found")

    # TODO: Fetch brand settings from DB
    # brand = await brand_service.get_brand(db, brand_id, user_id)
    # if not brand:
    #     raise NotFoundError(f"Brand {brand_id} not found")

    # Build template structure (placeholder)
    template_structure = {
        "slides": [
            {"slideNumber": 1, "textElements": {"title": "Hook"}},
            {"slideNumber": 2, "textElements": {"body": "Content"}},
        ]
    }

    brand_settings = {}  # TODO: Get from DB
    content_rules = {}  # TODO: Get from template.content_rules

    # Call Generate service
    try:
        carousel_variations = await generate_service.generate_carousel_content(
            topic=topic,
            brand_settings=brand_settings,
            content_rules=content_rules,
            template_structure=template_structure,
            count=count,
            provider="groq",  # Default to Groq for now
        )
    except Exception as e:
        logger.error(f"Generation failed: {e}")
        raise

    # Create Post objects from generated content
    posts = []
    for carousel_data in carousel_variations:
        post = await create_post(
            db=db,
            user_id=user_id,
            brand_id=brand_id,
            template_id=template_id,
            payload=PostCreate(
                brand_id=brand_id,
                template_id=template_id,
                platform=platform,
                content=carousel_data,  # Raw carousel data
                scheduled_time=scheduled_time,
                variant_set_id=variant_set_id,
            ),
        )
        posts.append(post)

    logger.info(f"Generated {len(posts)} posts for brand {brand_id}")
    return posts


# ═════════════════════════════════════════════════
#  CRUD Operations
# ═════════════════════════════════════════════════


async def create_post(
    db: AsyncSession, user_id: str, brand_id: str, template_id: str, payload: PostCreate
) -> Post:
    """Create a new post"""

    post_id = f"post_{uuid.uuid4().hex[:12]}"

    post = Post(
        id=post_id,
        brand_id=brand_id,
        template_id=template_id,
        platform=payload.platform,
        status=PostStatus.DRAFT.value,
        content=payload.content.model_dump()
        if hasattr(payload.content, "model_dump")
        else payload.content,
        rendering_status="pending",
        scheduled_time=payload.scheduled_time,
        variant_set_id=payload.variant_set_id,
        post_metadata={},
    )

    created = await repository.create(db, post)
    logger.info(f"Post created: {post_id} for brand {brand_id}")
    return created


async def get_post(db: AsyncSession, post_id: str, user_id: str | None = None) -> Post:
    """Get post by ID with optional user verification"""

    post = await repository.get_by_id(db, post_id)
    if not post:
        raise NotFoundError(f"Post {post_id} not found")

    # TODO: Verify user has access via brand ownership

    return post


async def list_brand_posts(
    db: AsyncSession, brand_id: str, user_id: str | None = None
) -> list[Post]:
    """Get all posts for a brand"""

    posts = await repository.get_by_brand(db, brand_id)
    logger.debug(f"Listed {len(posts)} posts for brand {brand_id}")
    return posts


async def list_posts_by_status(
    db: AsyncSession, brand_id: str, status: str, user_id: str | None = None
) -> list[Post]:
    """Get posts with specific status"""

    posts = await repository.get_by_status(db, brand_id, status)
    logger.debug(f"Listed {len(posts)} {status} posts for brand {brand_id}")
    return posts


async def list_scheduled_posts(
    db: AsyncSession, brand_id: str, user_id: str | None = None
) -> list[Post]:
    """Get scheduled posts for a brand"""

    posts = await repository.get_scheduled_posts(db, brand_id)
    logger.debug(f"Listed {len(posts)} scheduled posts for brand {brand_id}")
    return posts


async def update_post(
    db: AsyncSession, post_id: str, payload: PostUpdate, user_id: str | None = None
) -> Post:
    """Update post details"""

    post = await get_post(db, post_id, user_id)

    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(post, field, value)

    post.updated_at = datetime.utcnow()
    updated = await repository.update(db, post)
    logger.info(f"Post updated: {post_id}")
    return updated


async def mark_as_published(
    db: AsyncSession, post_id: str, user_id: str | None = None
) -> Post:
    """Mark post as published"""

    post = await get_post(db, post_id, user_id)
    post.status = PostStatus.POSTED.value
    post.published_time = datetime.utcnow()
    updated = await repository.update(db, post)
    logger.info(f"Post marked published: {post_id}")
    return updated


async def delete_post(
    db: AsyncSession, post_id: str, user_id: str | None = None
) -> None:
    """Delete a post"""

    post = await get_post(db, post_id, user_id)
    await repository.delete(db, post)
    logger.info(f"Post deleted: {post_id}")


# ═════════════════════════════════════════════════
#  Analytics & Metrics
# ═════════════════════════════════════════════════


async def get_post_analytics(db: AsyncSession, post_id: str) -> dict:
    """
    Get post analytics.

    TODO: Fetch from Supabase analytics tables
    """

    post = await get_post(db, post_id)
    return post.analytics or {}
