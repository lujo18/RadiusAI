# Gemini AI Response Models

from pydantic import BaseModel, Field
from typing import List, Literal
from datetime import datetime

# ==================== GEMINI RESPONSE MODELS ====================

class Slide(BaseModel):
    slideNumber: int
    text: str
    imagePrompt: str

class GeminiCarouselResponse(BaseModel):
    slides: List[Slide]
    caption: str
    hashtags: List[str]

class GenerateContentRequest(BaseModel):
    templateId: str
    topic: str
    platform: Literal["instagram", "tiktok"] = "instagram"
    count: int = Field(default=1, ge=1, le=10)

class GenerateContentResponse(BaseModel):
    posts: List[GeminiCarouselResponse]
    templateUsed: str
    generatedAt: datetime
