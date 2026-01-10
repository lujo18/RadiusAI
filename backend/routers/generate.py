from fastapi import APIRouter, HTTPException
import logging
from pydantic import BaseModel
from backend.services.genai.gemini_service import generate_content_with_gemini
from backend.services.genai.generate_slideshow import generate_slideshow_auto
from backend.models import Template
from backend.models.user import BrandSettings


class GeneratePostRequest(BaseModel):
    template: Template
    brand_settings: BrandSettings
    count: int = 1
    
class GeneratePostAutoRequest(BaseModel):
    prompt: str
    brand_settings: BrandSettings
    count: int = 1

router = APIRouter(prefix="/api/generate", tags=["generate"])

@router.post("/post/auto", response_model=dict)
async def generate_post_content_from_prompt(
    request: GeneratePostAutoRequest
):
    """Generate post content using Gemini AI from a text prompt (auto layout selection)."""
    print("Request ", request)
    try:
        post_content = generate_slideshow_auto(
            request.prompt,
            request.brand_settings,
            request.count
        )
        
        return {"postContent": post_content, "message": "Content generated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/post", response_model=dict)
async def generate_post_content(
    request: GeneratePostRequest
):
    """Generate post content using Gemini AI based on a predefined template."""
    print("Request ", request)
    try:
        post_content = generate_content_with_gemini(
            request.template,
            request.brand_settings,
            request.count
        )
        return {"postContent": post_content, "message": "Content generated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))