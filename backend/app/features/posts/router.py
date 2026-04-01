"""
Post HTTP endpoints - Generation and CRUD for posts
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.exceptions import AppError
from app.features.posts import service
from app.features.posts.schemas import (
    GeneratePostRequest,
    PostCreate,
    PostUpdate,
    PostResponse,
    PostListResponse,
    GeneratePostResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/posts",
    tags=["posts"],
    responses={
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden"},
        404: {"description": "Not Found"},
    },
)


# ═════════════════════════════════════════════════
#  Generation
# ═════════════════════════════════════════════════


@router.post("/generate", response_model=GeneratePostResponse, status_code=201)
async def generate_posts(
    request: GeneratePostRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate new posts using AI.

    Requires: Authorization: Bearer <token>
    """
    try:
        posts = await service.generate_posts(
            db=db,
            user_id=user_id,
            brand_id=request.brand_id,
            template_id=request.template_id,
            topic=request.topic,
            count=request.count,
            platform=request.platform,
            scheduled_time=request.scheduled_time,
        )

        return GeneratePostResponse(
            posts=[PostResponse.model_validate(p) for p in posts],
            message="Posts generated successfully",
        )
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


# ═════════════════════════════════════════════════
#  List Posts
# ═════════════════════════════════════════════════


@router.get("/brand/{brand_id}", response_model=list[PostListResponse])
async def list_brand_posts(
    brand_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all posts for a brand"""
    try:
        posts = await service.list_brand_posts(db, brand_id, user_id)
        return posts
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.get("/brand/{brand_id}/status/{status}", response_model=list[PostListResponse])
async def list_posts_by_status(
    brand_id: str,
    status: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List posts by status"""
    try:
        posts = await service.list_posts_by_status(db, brand_id, status, user_id)
        return posts
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.get("/brand/{brand_id}/scheduled", response_model=list[PostListResponse])
async def list_scheduled_posts(
    brand_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List scheduled posts"""
    try:
        posts = await service.list_scheduled_posts(db, brand_id, user_id)
        return posts
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


# ═════════════════════════════════════════════════
#  Get Post
# ═════════════════════════════════════════════════


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get post details"""
    try:
        post = await service.get_post(db, post_id, user_id)
        return post
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


# ═════════════════════════════════════════════════
#  Update Post
# ═════════════════════════════════════════════════


@router.patch("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: str,
    payload: PostUpdate,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update post details"""
    try:
        post = await service.update_post(db, post_id, payload, user_id)
        logger.info(f"Post updated: {post_id}")
        return post
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.post("/{post_id}/publish", response_model=PostResponse)
async def publish_post(
    post_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark post as published"""
    try:
        post = await service.mark_as_published(db, post_id, user_id)
        logger.info(f"Post published: {post_id}")
        return post
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


# ═════════════════════════════════════════════════
#  Delete Post
# ═════════════════════════════════════════════════


@router.delete("/{post_id}", status_code=204)
async def delete_post(
    post_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a post"""
    try:
        await service.delete_post(db, post_id, user_id)
        logger.info(f"Post deleted: {post_id}")
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


# ═════════════════════════════════════════════════
#  Analytics
# ═════════════════════════════════════════════════


@router.get("/{post_id}/analytics", response_model=dict)
async def get_post_analytics(
    post_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get post analytics"""
    try:
        analytics = await service.get_post_analytics(db, post_id)
        return analytics
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
