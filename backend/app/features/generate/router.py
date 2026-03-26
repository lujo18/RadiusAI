"""
Generate feature router - AI-powered content generation endpoints
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder

from app.shared.dependencies import get_current_user
from app.features.generate.schemas import (
    GeneratePostRequest,
    GeneratePostAutoRequest,
    GeneratePostResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/generate", tags=["content-generation"])


@router.post("/post", response_model=GeneratePostResponse)
async def create_post(
    request: GeneratePostRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Generate post content using AI based on a predefined template.
    
    Consumes user's generation credits and returns generated content.
    """
    try:
        # Import here to avoid circular dependencies
        from app.features.usage.service import (
            check_generation_credits,
            track_slides_generated,
        )
        from app.features.generate.genai.gemini_service import generate_content_with_gemini
        
        # Check generation credits with grace period
        credit_check = check_generation_credits(user_id, request.count)
        if not credit_check["allowed"]:
            raise HTTPException(
                status_code=402,
                detail=credit_check["message"]
            )
        
        # Generate content
        post_content = generate_content_with_gemini(
            request.template,
            request.brand_settings,
            request.count
        )
        
        # Track usage
        track_slides_generated(user_id, request.count)
        
        # Build response with optional credit warning
        response = {
            "posts": post_content,
            "message": "Content generated successfully"
        }
        
        if credit_check.get("will_exceed"):
            response["credit_warning"] = credit_check["message"]
            response["credit_info"] = {
                "current": credit_check["current_credits"],
                "consumed": credit_check["credits_to_consume"],
                "projected": credit_check["projected_credits"],
                "limit": credit_check["credit_limit"]
            }
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Content generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/post/auto", response_model=GeneratePostResponse)
async def generate_post_content_from_prompt(
    request: GeneratePostAutoRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Generate post content using AI with automatic layout selection.
    
    Analyzes template and brand settings to automatically choose optimal layout.
    Consumes user's generation credits.
    """
    try:
        # Import here to avoid circular dependencies
        from app.features.usage.service import (
            check_generation_credits,
            track_slides_generated,
        )
        from app.features.posts.utilities.slide_generation import generate_slideshows
        from app.features.integrations.supabase.db.brand_cta import get_brand_cta
        
        # Check generation credits with grace period
        credit_check = check_generation_credits(user_id, request.count)
        if not credit_check["allowed"]:
            raise HTTPException(
                status_code=402,
                detail=credit_check["message"]
            )
        
        # Fetch CTA if provided
        cta = None
        if request.cta_id:
            cta = get_brand_cta(request.cta_id)
            if not cta:
                raise HTTPException(status_code=404, detail="CTA not found")
        
        # Generate slideshows with auto layout selection
        posts = generate_slideshows(
            user_id=user_id,
            brand_id=request.brand_id,
            template=request.template,
            brand_settings=request.brand_settings,
            count=request.count,
            cta=cta,
            stock_pack_directory=request.stock_pack_directory
        )
        
        encoded_posts = jsonable_encoder(posts)
        
        # Track usage
        track_slides_generated(user_id, request.count)
        
        # Build response with optional credit warning
        response = {
            "posts": encoded_posts,
            "message": "Content generated successfully"
        }
        
        if credit_check.get("will_exceed"):
            response["credit_warning"] = credit_check["message"]
            response["credit_info"] = {
                "current": credit_check["current_credits"],
                "consumed": credit_check["credits_to_consume"],
                "projected": credit_check["projected_credits"],
                "limit": credit_check["credit_limit"]
            }
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auto post generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
