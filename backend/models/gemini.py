# Gemini AI Response Models

from typing import List, Literal
from datetime import datetime
from pydantic import BaseModel, Field

# ==================== GEMINI RESPONSE MODELS ====================


class Slide(BaseModel):
    """Represents a single slide produced by Gemini."""
    slideNumber: int
    text: str
    imagePrompt: str


class GeminiCarouselResponse(BaseModel):
    """Top-level carousel response returned by Gemini generation."""
    slides: List[Slide]
    caption: str
    hashtags: List[str]


class GenerateContentRequest(BaseModel):
    """Request payload for generating content via Gemini."""
    templateId: str
    topic: str
    platform: Literal["instagram", "tiktok"] = "instagram"
    count: int = Field(default=1, ge=1, le=10)


class GenerateContentResponse(BaseModel):
    """Response wrapper for generated posts and metadata."""
    posts: List[GeminiCarouselResponse]
    templateUsed: str
    generatedAt: datetime
