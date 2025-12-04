from fastapi import APIRouter, HTTPException
from backend.ai.gemini_service import generate_content_with_gemini
from backend.models import Template
from backend.models.user import BrandSettings


router = APIRouter(prefix="/api/generate", tags=["generate"])

@router.post("/post", response_model=dict)
async def generate_post_content(
    template: Template,
    brand_settings: BrandSettings,
    count: int,
    # user_id: str = Depends(get_current_user)
):
    """Generate post content using Gemini AI based on the provided template and brand settings."""
    try:
        post_content = generate_content_with_gemini(
            template,
            brand_settings,
            count
        )
        return {"postContent": post_content, "message": "Content generated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))