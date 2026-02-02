from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
import logging
from pydantic import BaseModel
from typing import Optional
from backend.auth import get_current_user
from backend.services.genai.gemini_service import generate_content_with_gemini
from backend.services.genai.generate_slideshow import generate_slideshow_auto
from backend.models import Template
from backend.models.user import BrandSettings
from backend.services.integrations.groq.util.GenerateBrand import generate_brand
from backend.services.slides.slide_generation import generate_slideshows
from backend.services.genai.client import client
from backend.services.integrations.supabase.db.brand_cta import get_brand_cta
from google.genai import types
import json

from backend.services.usage.service import track_slides_generated


class GeneratePostRequest(BaseModel):
    template: Template
    brand_settings: BrandSettings
    brand_id: str
    count: int = 1
    
class GeneratePostAutoRequest(BaseModel):
    template: Template
    brand_settings: BrandSettings
    brand_id: str
    count: int = 1
    cta_id: Optional[str] = None

router = APIRouter(prefix="/api/generate", tags=["generate"])

@router.post("/post/auto", response_model=dict)
async def generate_post_content_from_prompt(
    request: GeneratePostAutoRequest,
    user_id: str = Depends(get_current_user)
):
    """Generate post content using Gemini AI from a text prompt (auto layout selection)."""
    print("Request ", request)
    try:
        # Fetch CTA if provided
        cta = None
        if request.cta_id:
            cta = get_brand_cta(request.cta_id)
            if not cta:
                raise HTTPException(status_code=404, detail="CTA not found")
        
        posts = generate_slideshows(
            user_id=user_id,
            brand_id=request.brand_id,
            template=request.template,
            brand_settings=request.brand_settings,
            count=request.count,
            cta=cta
        )
        
        encoded_posts = jsonable_encoder(posts)
        print("Encoded posts: ", encoded_posts)
        
        track_slides_generated(user_id, request.count)
        
        # FastAPI's jsonable_encoder handles nested Pydantic models automatically
        return {"posts": encoded_posts, "message": "Content generated successfully"}
    except Exception as e:
        logging.error(f"Error generating posts: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/post", response_model=dict)
async def create_post(
    request: GeneratePostRequest,
    user_id: str = Depends(get_current_user)
):
    """Generate post content using Gemini AI based on a predefined template."""
    
    try:
        post_content = generate_content_with_gemini(
            request.template,
            request.brand_settings,
            request.count
        )
        return {"postContent": post_content, "message": "Content generated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

