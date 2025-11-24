"""
Post Routes - CRUD operations for posts
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import List, Optional
from models import (
    Post,
    CreatePostRequest,
    UpdatePostRequest,
    TrackAnalyticsRequest
)
from services.firestore_service import (
    create_post,
    get_post,
    get_user_posts,
    update_post,
    update_post_status,
    upload_slide_image,
    upload_thumbnail,
    track_post_analytics,
    get_post_analytics
)
from auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/api/posts", tags=["posts"])


@router.post("/", response_model=dict)
async def create_new_post(
    post_data: CreatePostRequest,
    user_id: str = Depends(get_current_user)
):
    """Create a new post"""
    try:
        post_id = await create_post(user_id, post_data)
        return {"postId": post_id, "message": "Post created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[dict])
async def list_posts(
    status: Optional[str] = None,
    limit: int = 100,
    user_id: str = Depends(get_current_user)
):
    """Get all posts for the authenticated user"""
    try:
        posts = await get_user_posts(user_id, limit, status)
        return posts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{post_id}", response_model=dict)
async def get_post_details(
    post_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Get post details with all information
    Used for dashboard/post/[id] page
    
    Returns:
    - Post content (slides, caption, hashtags)
    - Storage URLs for slide images
    - Analytics metrics
    - Template information
    - Analytics history (last 30 days)
    """
    try:
        post = await get_post(post_id)
        
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Verify ownership
        if post['userId'] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to view this post")
        
        return post
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{post_id}", response_model=dict)
async def update_post_details(
    post_id: str,
    updates: UpdatePostRequest,
    user_id: str = Depends(get_current_user)
):
    """Update post status, content, or scheduled time"""
    try:
        # Verify ownership
        post = await get_post(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        if post['userId'] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to modify this post")
        
        update_data = updates.dict(exclude_unset=True)
        await update_post(post_id, update_data)
        
        return {"message": "Post updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{post_id}/publish", response_model=dict)
async def publish_post(
    post_id: str,
    user_id: str = Depends(get_current_user)
):
    """Mark post as published"""
    try:
        # Verify ownership
        post = await get_post(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        if post['userId'] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        await update_post_status(post_id, "published", datetime.now())
        return {"message": "Post published successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{post_id}/upload-slide", response_model=dict)
async def upload_post_slide(
    post_id: str,
    slide_number: int,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    """
    Upload a slide image to Firebase Storage
    
    Args:
    - post_id: Post ID
    - slide_number: Slide number (1-based index)
    - file: Image file (PNG/JPEG)
    """
    try:
        # Verify ownership
        post = await get_post(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        if post['userId'] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Read file data
        image_data = await file.read()
        
        # Upload to Firebase Storage
        url = await upload_slide_image(post_id, slide_number, image_data, file.content_type)
        
        return {
            "message": f"Slide {slide_number} uploaded successfully",
            "url": url,
            "slideNumber": slide_number
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{post_id}/upload-thumbnail", response_model=dict)
async def upload_post_thumbnail(
    post_id: str,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    """Upload post thumbnail image"""
    try:
        # Verify ownership
        post = await get_post(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        if post['userId'] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Read file data
        image_data = await file.read()
        
        # Upload to Firebase Storage
        url = await upload_thumbnail(post_id, image_data)
        
        return {
            "message": "Thumbnail uploaded successfully",
            "url": url
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{post_id}/analytics", response_model=dict)
async def track_analytics(
    post_id: str,
    analytics_data: TrackAnalyticsRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Track analytics for a post
    Updates both the analytics collection and embedded post analytics
    """
    try:
        # Verify ownership
        post = await get_post(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        if post['userId'] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        analytics_id = await track_post_analytics(analytics_data, user_id)
        
        return {
            "analyticsId": analytics_id,
            "message": "Analytics tracked successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{post_id}/analytics", response_model=List[dict])
async def get_analytics_history(
    post_id: str,
    days: int = 30,
    user_id: str = Depends(get_current_user)
):
    """Get analytics history for a post"""
    try:
        # Verify ownership
        post = await get_post(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        if post['userId'] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        analytics = await get_post_analytics(post_id, days)
        return analytics
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
