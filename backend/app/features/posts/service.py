"""
Post Service - Business logic for post operations and generation
"""

import logging
import uuid
from datetime import datetime
from typing import Optional

from app.core.config import settings
from app.core.database import get_db_session
from app.core.exceptions import ExternalServiceError, NotFoundError, ValidationError
from app.features.generate.service import generate_service
from app.features.posts.models import Post, PostStatus
from app.features.posts.repository import PostRepository
from app.features.posts.schemas import PostCreate, PostUpdate

logger = logging.getLogger(__name__)

class PostService:
    """Business logic for post operations and generation."""

    def __init__(self, repository: Optional[PostRepository] = None):
        self.repository = repository or PostRepository()

    @staticmethod
    def _platforms_for_post(post: Post) -> list[str]:
        platform = str(post.platform).strip() if post.platform else ""
        if not platform:
            raise ValidationError("Post has no platform configured")
        return [platform]

    async def _send_to_social_provider(
        self,
        action: str,
        post: Post,
        scheduled_time: datetime | None = None,
    ) -> dict:
        # Lazy import avoids circular import through app.features.posts package init.
        from app.lib.social.provider import get_social_provider

        try:
            provider = get_social_provider()
        except Exception as exc:
            raise ValidationError(f"Invalid social provider configuration: {exc}") from exc

        brand_id = str(post.brand_id)
        platforms = self._platforms_for_post(post)

        try:
            if action == "publish":
                result = await provider.publish_post(brand_id, platforms, str(post.id))
            elif action == "draft":
                result = await provider.draft_post(brand_id, platforms, str(post.id))
            elif action == "scheduled":
                if scheduled_time is None:
                    raise ValidationError("scheduled_time is required for scheduled posts")
                result = await provider.schedule_post(
                    brand_id,
                    platforms,
                    str(post.id),
                    scheduled_time.isoformat(),
                )
            else:
                raise ValidationError(f"Unsupported social provider action: {action}")
        except NotImplementedError as exc:
            raise ValidationError(
                f"Configured social provider does not support '{action}'"
            ) from exc
        except ValidationError:
            raise
        except Exception as exc:
            raise ExternalServiceError("Social provider", str(exc)) from exc

        if not isinstance(result, dict) or not result:
            raise ExternalServiceError(
                "Social provider", f"{action} did not return a valid response"
            )

        return result

    @staticmethod
    def _apply_provider_result(post: Post, action: str, result: dict) -> None:
        external_post_id = result.get("external_post_id")
        if external_post_id:
            post.external_post_id = str(external_post_id)

        external_permalink = result.get("external_permalink") or result.get("post_url")
        if external_permalink:
            post.external_permalink = str(external_permalink)

        platform_ids = result.get("platform_ids")
        if isinstance(platform_ids, list):
            post.platform_ids = [str(platform_id) for platform_id in platform_ids]

        metadata = dict(post.post_metadata or {})
        metadata["last_social_provider_action"] = {
            "action": action,
            "status": result.get("status"),
            "updated_at": datetime.utcnow().isoformat(),
        }
        post.post_metadata = metadata

    async def _get_post_or_raise(self, db, post_id: str) -> Post:
        post = await self.repository.get_by_id(db, post_id)
        if not post:
            raise NotFoundError("Post", post_id)
        return post

    async def _create_post_with_db(
        self,
        db,
        user_id: str,
        brand_id: str,
        template_id: str,
        payload: PostCreate,
    ) -> Post:
        post_id = str(uuid.uuid4())
        post = Post(
            id=post_id,
            brand_id=brand_id,
            template_id=template_id,
            platform=payload.platform,
            status=PostStatus.DRAFT.value,
            content=payload.content.model_dump()
            if hasattr(payload.content, "model_dump")
            else payload.content,
            scheduled_time=payload.scheduled_time,
            variant_set_id=payload.variant_set_id,
            post_metadata={},
        )
        created = await self.repository.create(db, post)
        logger.info(f"Post created: {post_id} for brand {brand_id}")
        _ = user_id
        return created

    async def generate_posts(
        self,
        user_id: str,
        brand_id: str,
        template_id: str,
        topic: str,
        count: int = 1,
        platform: str = "instagram",
        scheduled_time: datetime | None = None,
        variant_set_id: str | None = None,
    ) -> list[Post]:
        """Generate posts using AI."""
        if count < 1 or count > 10:
            raise ValidationError("Count must be 1-10 for generation")

        # TODO: Fetch template from DB to validate and get structure.
        # template = await template_service.get_template(template_id, user_id)

        # TODO: Fetch brand settings from DB.
        # brand = await brand_service.get_brand(brand_id, user_id)

        template_structure = {
            "slides": [
                {"slideNumber": 1, "textElements": {"title": "Hook"}},
                {"slideNumber": 2, "textElements": {"body": "Content"}},
            ]
        }
        brand_settings = {}
        content_rules = {}

        try:
            carousel_variations = await generate_service.generate_carousel_content(
                topic=topic,
                brand_settings=brand_settings,
                content_rules=content_rules,
                template_structure=template_structure,
                count=count,
                provider=settings.DEFAULT_AI_PROVIDER,
            )
        except Exception as e:
            logger.error(f"Generation failed: {e}")
            raise

        posts = []
        async with get_db_session() as db:
            for carousel_data in carousel_variations:
                post = await self._create_post_with_db(
                    db=db,
                    user_id=user_id,
                    brand_id=brand_id,
                    template_id=template_id,
                    payload=PostCreate.model_validate(
                        {
                            "brand_id": brand_id,
                            "template_id": template_id,
                            "platform": platform,
                            "content": carousel_data,
                            "scheduled_time": scheduled_time,
                            "variant_set_id": variant_set_id,
                        }
                    ),
                )
                posts.append(post)

        logger.info(f"Generated {len(posts)} posts for brand {brand_id}")
        return posts

    async def create_post(
        self, user_id: str, brand_id: str, template_id: str, payload: PostCreate
    ) -> Post:
        """Create a new post."""
        async with get_db_session() as db:
            return await self._create_post_with_db(
                db=db,
                user_id=user_id,
                brand_id=brand_id,
                template_id=template_id,
                payload=payload,
            )

    async def get_post(self, post_id: str, user_id: str | None = None) -> Post:
        """Get post by ID with optional user verification."""
        async with get_db_session() as db:
            post = await self._get_post_or_raise(db, post_id)
            # TODO: Verify user has access via brand ownership.
            _ = user_id
            return post

    async def list_brand_posts(
        self, brand_id: str, user_id: str | None = None
    ) -> list[Post]:
        """Get all posts for a brand."""
        async with get_db_session() as db:
            posts = await self.repository.get_by_brand(db, brand_id)
            logger.debug(f"Listed {len(posts)} posts for brand {brand_id}")
            _ = user_id
            return posts

    async def list_posts_by_status(
        self, brand_id: str, status: str, user_id: str | None = None
    ) -> list[Post]:
        """Get posts with specific status."""
        async with get_db_session() as db:
            posts = await self.repository.get_by_status(db, brand_id, status)
            logger.debug(f"Listed {len(posts)} {status} posts for brand {brand_id}")
            _ = user_id
            return posts

    async def list_scheduled_posts(
        self, brand_id: str, user_id: str | None = None
    ) -> list[Post]:
        """Get scheduled posts for a brand."""
        async with get_db_session() as db:
            posts = await self.repository.get_scheduled_posts(db, brand_id)
            logger.debug(f"Listed {len(posts)} scheduled posts for brand {brand_id}")
            _ = user_id
            return posts

    async def update_post(
        self, post_id: str, payload: PostUpdate, user_id: str | None = None
    ) -> Post:
        """Update post details."""
        async with get_db_session() as db:
            post = await self._get_post_or_raise(db, post_id)
            update_data = payload.model_dump(exclude_unset=True)

            requested_status = update_data.get("status")
            if requested_status == PostStatus.DRAFT.value:
                provider_result = await self._send_to_social_provider(
                    action="draft", post=post
                )
                self._apply_provider_result(post, "draft", provider_result)
            elif requested_status == PostStatus.SCHEDULED.value:
                scheduled_time = update_data.get("scheduled_time") or post.scheduled_time
                if scheduled_time is None:
                    raise ValidationError(
                        "scheduled_time is required when status is 'scheduled'"
                    )
                provider_result = await self._send_to_social_provider(
                    action="scheduled", post=post, scheduled_time=scheduled_time
                )
                self._apply_provider_result(post, "scheduled", provider_result)
            elif requested_status == PostStatus.POSTED.value:
                provider_result = await self._send_to_social_provider(
                    action="publish", post=post
                )
                self._apply_provider_result(post, "publish", provider_result)
                update_data.setdefault("published_time", datetime.utcnow())

            for field, value in update_data.items():
                setattr(post, field, value)
            post.updated_at = datetime.utcnow()
            updated = await self.repository.update(db, post)
            logger.info(f"Post updated: {post_id}")
            _ = user_id
            return updated

    async def mark_as_published(
        self, post_id: str, user_id: str | None = None
    ) -> Post:
        """Mark post as published."""
        async with get_db_session() as db:
            post = await self._get_post_or_raise(db, post_id)
            provider_result = await self._send_to_social_provider(
                action="publish", post=post
            )
            self._apply_provider_result(post, "publish", provider_result)
            post.status = PostStatus.POSTED.value
            post.published_time = datetime.utcnow()
            updated = await self.repository.update(db, post)
            logger.info(f"Post marked published: {post_id}")
            _ = user_id
            return updated

    async def delete_post(self, post_id: str, user_id: str | None = None) -> None:
        """Delete a post."""
        async with get_db_session() as db:
            await self._get_post_or_raise(db, post_id)
            await self.repository.delete_by_id(db, post_id)
            logger.info(f"Post deleted: {post_id}")
            _ = user_id

    async def get_post_analytics(self, post_id: str) -> dict:
        """Get post analytics."""
        async with get_db_session() as db:
            post = await self._get_post_or_raise(db, post_id)
            return post.analytics or {}


def get_post_service() -> PostService:
    """Create a request-scoped post service."""
    return PostService()


def generate_slideshows(*args, **kwargs):
    """Backward-compatible export for legacy callers.

    Canonical implementation lives in posts.utilities.slide_generation.
    """
    from app.features.posts.utilities.slide_generation import (
        generate_slideshows as _generate_slideshows,
    )

    return _generate_slideshows(*args, **kwargs)


__all__ = ["PostService", "get_post_service", "generate_slideshows"]
