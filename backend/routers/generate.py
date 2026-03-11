from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
import logging
from pydantic import BaseModel
from typing import Optional
from auth import get_current_user
from backend.features.error.helper import api_error
from backend.features.error.response import SuccessResponse
from services.genai.gemini_service import generate_content_with_gemini
from services.genai.generate_slideshow import generate_slideshow_auto
from models import Template
from models.user import BrandSettings
from services.integrations.groq.util.GenerateBrand import generate_brand
from services.slides.slide_generation import generate_slideshows
from services.genai.client import client
from services.integrations.supabase.db.brand_cta import get_brand_cta
from google.genai import types
import json

from services.usage.service import track_slides_generated, check_generation_credits


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

@router.post("/post/auto", response_model=SuccessResponse)
async def generate_post_content_from_prompt(
    request: GeneratePostAutoRequest,
    user_id: str = Depends(get_current_user)
):
    """Generate post content using Gemini AI from a text prompt (auto layout selection)."""
    print("Request ", request)
    # Check generation credits with grace period
    credit_check = check_generation_credits(user_id, request.count)
    if not credit_check["allowed"]:
        api_error(402, "INSUFFICIENT_CREDITS", credit_check["message"])
    
    # Fetch CTA if provided
    cta = None
    if request.cta_id:
        cta = get_brand_cta(request.cta_id)
        if not cta:
            api_error(404, "CTA_NOT_FOUND", "CTA not found")
    
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
    
    # Build response with optional credit warning
    response = {"posts": encoded_posts, "message": "Content generated successfully"}
    if credit_check.get("will_exceed"):
        response["credit_warning"] = credit_check["message"]
        response["credit_info"] = {
            "current": credit_check["current_credits"],
            "consumed": credit_check["credits_to_consume"],
            "projected": credit_check["projected_credits"],
            "limit": credit_check["credit_limit"]
        }
    
    return SuccessResponse(data=response)

@router.post("/post", response_model=SuccessResponse)
async def create_post(
    request: GeneratePostRequest,
    user_id: str = Depends(get_current_user)
):
    """Generate post content using Gemini AI based on a predefined template."""
    # Check generation credits with grace period
    credit_check = check_generation_credits(user_id, request.count)
    if not credit_check["allowed"]:
        api_error(402, "INSUFFICIENT_CREDITS", credit_check["message"])
    
    try:
        post_content = generate_content_with_gemini(
            request.template,
            request.brand_settings,
            request.count
        )
    except Exception as e:
        api_error(500, "GENERATION_FAILED", str(e))
    
    track_slides_generated(user_id, request.count)
    
    # Build response with optional credit warning
    response = {"postContent": post_content, "message": "Content generated successfully"}
    if credit_check.get("will_exceed"):
        response["credit_warning"] = credit_check["message"]
        response["credit_info"] = {
            "current": credit_check["current_credits"],
            "consumed": credit_check["credits_to_consume"],
            "projected": credit_check["projected_credits"],
            "limit": credit_check["credit_limit"]
        }
    
    return SuccessResponse(data=response)

