import logging

from fastapi import APIRouter, Depends, HTTPException, Query

from app.features.blog.dependencies import get_current_admin_user
from app.features.blog.schemas import (
    BlogDraftResponse,
    BlogGenerateRequest,
    BlogGenerateResponse,
    BlogListResponse,
    BlogPostResponse,
    BlogPublishRequest,
)
from app.features.blog.services.generation import BlogGenerationService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/blog", tags=["blog"])
admin_router = APIRouter(prefix="/admin/blog", tags=["admin-blog"])


def get_blog_service() -> BlogGenerationService:
    return BlogGenerationService()


@router.get("", response_model=BlogListResponse)
def list_published_blog_posts(
    limit: int = Query(default=50, ge=1, le=500),
    blog_service: BlogGenerationService = Depends(get_blog_service),
):
    posts = blog_service.list_published_posts(limit=limit)
    return {"posts": posts}


@router.get("/{slug}", response_model=BlogPostResponse)
def get_published_blog_post(
    slug: str,
    blog_service: BlogGenerationService = Depends(get_blog_service),
):
    post = blog_service.get_published_post(slug=slug)
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return post


@admin_router.get("/posts", response_model=BlogListResponse)
def list_admin_blog_posts(
    limit: int = Query(default=200, ge=1, le=500),
    _admin_user_id: str = Depends(get_current_admin_user),
    blog_service: BlogGenerationService = Depends(get_blog_service),
):
    posts = blog_service.list_admin_posts(limit=limit)
    return {"posts": posts}


@admin_router.post("/generate", response_model=BlogGenerateResponse)
def generate_admin_blog_draft(
    payload: BlogGenerateRequest,
    admin_user_id: str = Depends(get_current_admin_user),
    blog_service: BlogGenerationService = Depends(get_blog_service),
):
    try:
        draft = blog_service.generate_draft(
            keyword=payload.keyword,
            tone=payload.tone,
            audience=payload.audience,
        )

        if payload.publish_immediately:
            published_post = blog_service.publish(
                BlogPublishRequest(
                    title=draft.title,
                    slug=draft.slug,
                    excerpt=draft.excerpt,
                    content=draft.content,
                    cover_image_url=draft.cover_image_url,
                    seo_keywords=draft.seo_keywords,
                    is_published=True,
                ),
                author_id=admin_user_id,
            )
            return {"draft": draft, "published_post": published_post}

        return {"draft": draft, "published_post": None}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Admin blog generation failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@admin_router.post("/publish", response_model=BlogPostResponse)
def publish_admin_blog_post(
    payload: BlogPublishRequest,
    admin_user_id: str = Depends(get_current_admin_user),
    blog_service: BlogGenerationService = Depends(get_blog_service),
):
    try:
        return blog_service.publish(payload, author_id=admin_user_id)
    except Exception as exc:
        logger.error("Admin blog publish failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
