"""
Template Routes - CRUD operations for templates
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import List, Optional
from models import (
    Template, 
    CreateTemplateRequest, 
    UpdateTemplateRequest,
    TemplatePerformance
)
from services.firestore_service import (
    create_template,
    get_template,
    get_user_templates,
    update_template,
    delete_template,
    set_default_template,
    get_template_posts,
    get_template_analytics
)
from auth import get_current_user

router = APIRouter(prefix="/api/templates", tags=["templates"])


@router.post("/", response_model=dict)
async def create_new_template(
    template_data: CreateTemplateRequest,
    user_id: str = Depends(get_current_user)
):
    """Create a new template"""
    try:
        template_id = await create_template(user_id, template_data)
        return {"templateId": template_id, "message": "Template created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[dict])
async def list_templates(user_id: str = Depends(get_current_user)):
    """Get all templates for the authenticated user"""
    try:
        templates = await get_user_templates(user_id)
        return templates
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{template_id}", response_model=dict)
async def get_template_details(
    template_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Get template details with performance metrics
    Used for dashboard/template/[id] page
    """
    try:
        template = await get_template(template_id)
        
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        # Verify ownership
        if template['userId'] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to view this template")
        
        # Get posts for this template
        posts = await get_template_posts(template_id, limit=100)
        
        # Get analytics history
        analytics = await get_template_analytics(template_id, days=30)
        
        return {
            "template": template,
            "posts": posts,
            "analytics": analytics,
            "summary": {
                "totalPosts": len(posts),
                "avgEngagementRate": template['performance']['avgEngagementRate'],
                "avgSaves": template['performance']['avgSaves'],
                "avgImpressions": template['performance']['avgImpressions']
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{template_id}", response_model=dict)
async def update_template_details(
    template_id: str,
    updates: UpdateTemplateRequest,
    user_id: str = Depends(get_current_user)
):
    """Update template name, category, style config, etc."""
    try:
        # Verify ownership
        template = await get_template(template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        if template['userId'] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to modify this template")
        
        await update_template(template_id, updates)
        return {"message": "Template updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{template_id}", response_model=dict)
async def archive_template(
    template_id: str,
    user_id: str = Depends(get_current_user)
):
    """Archive (soft delete) a template"""
    try:
        # Verify ownership
        template = await get_template(template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        if template['userId'] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this template")
        
        await delete_template(template_id)
        return {"message": "Template archived successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{template_id}/set-default", response_model=dict)
async def set_template_as_default(
    template_id: str,
    user_id: str = Depends(get_current_user)
):
    """Set a template as the default for the user"""
    try:
        # Verify ownership
        template = await get_template(template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        if template['userId'] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        await set_default_template(user_id, template_id)
        return {"message": "Default template updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{template_id}/posts", response_model=List[dict])
async def get_posts_by_template(
    template_id: str,
    limit: int = 50,
    user_id: str = Depends(get_current_user)
):
    """Get all posts created from this template"""
    try:
        # Verify ownership
        template = await get_template(template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        if template['userId'] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        posts = await get_template_posts(template_id, limit)
        return posts
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{template_id}/analytics", response_model=List[dict])
async def get_template_performance_analytics(
    template_id: str,
    days: int = 30,
    user_id: str = Depends(get_current_user)
):
    """Get analytics history for a template"""
    try:
        # Verify ownership
        template = await get_template(template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        if template['userId'] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        analytics = await get_template_analytics(template_id, days)
        return analytics
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
