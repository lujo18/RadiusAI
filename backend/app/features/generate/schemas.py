"""
Generate feature Pydantic schemas for request/response DTOs
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any


class GeneratePostRequest(BaseModel):
    """Request to generate post content from template."""
    template: Dict[str, Any] = Field(..., description="Template configuration")
    brand_settings: Dict[str, Any] = Field(..., description="Brand voice, tone, settings")
    brand_id: str = Field(..., description="Brand ID for context")
    count: int = Field(default=1, ge=1, le=10, description="Number of variations to generate")


class GeneratePostAutoRequest(BaseModel):
    """Request to generate post content with automatic layout selection."""
    template: Dict[str, Any] = Field(..., description="Template configuration")
    brand_settings: Dict[str, Any] = Field(..., description="Brand voice, tone, settings")
    brand_id: str = Field(..., description="Brand ID for context")
    count: int = Field(default=1, ge=1, le=10, description="Number of variations to generate")
    cta_id: Optional[str] = Field(None, description="Optional call-to-action ID")
    stock_pack_directory: Optional[str] = Field(None, description="Optional stock pack directory")


class GeneratedPost(BaseModel):
    """Generated post content."""
    slides: list[Dict[str, Any]] = Field(..., description="Array of slide content")
    caption: str = Field(..., description="Post caption")
    hashtags: list[str] = Field(default_factory=list, description="Suggested hashtags")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")


class GeneratePostResponse(BaseModel):
    """Response from post generation."""
    posts: list[GeneratedPost] = Field(..., description="Generated posts")
    message: str = Field(default="Content generated successfully")
    credit_warning: Optional[str] = Field(None, description="Warning if credits near limit")
    credit_info: Optional[Dict[str, Any]] = Field(None, description="Credit usage details")


class GeneratePostAutoResponse(BaseModel):
    """Response from auto post generation."""
    posts: list[GeneratedPost] = Field(..., description="Generated posts")
    message: str = Field(default="Content generated successfully")
    credit_warning: Optional[str] = Field(None, description="Warning if credits near limit")
    credit_info: Optional[Dict[str, Any]] = Field(None, description="Credit usage details")
