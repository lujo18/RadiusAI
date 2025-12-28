from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.services.genai.gemini_service import generate_content_with_gemini
from backend.models import Template
from backend.models.user import BrandSettings

class GeneratePostRequest(BaseModel):
    template: Template
    brandSettings: BrandSettings  # Match frontend camelCase
    count: int = 1

router = APIRouter(prefix="/api/generate", tags=["generate"])

@router.post("/post", response_model=dict)
async def generate_post_content(
    request: GeneratePostRequest
):
    print("Request ", request)

    """Generate post content using Gemini AI based on the provided template and brand settings."""
    try:
        post_content = generate_content_with_gemini(
            request.template,
            request.brandSettings,
            request.count
        )
        return {"postContent": post_content, "message": "Content generated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
