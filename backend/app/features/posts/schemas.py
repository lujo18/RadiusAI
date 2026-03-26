"""
Post Request/Response Schemas - Pydantic DTOs for post operations
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime


# ═════════════════════════════════════════════════
#  Content Structure (for generated posts)
# ═════════════════════════════════════════════════

class TextElementResponse(BaseModel):
    """Text element in a slide"""
    id: str
    type: Literal["text"] = "text"
    content: str
    font_size: int
    font_family: str
    color: str
    x: float
    y: float
    width: float


class BackgroundConfig(BaseModel):
    """Slide background configuration"""
    type: Literal["solid", "gradient", "image"] = "solid"
    color: Optional[str] = None
    image_url: Optional[str] = None
    gradient_colors: Optional[tuple[str, str]] = None


class PostSlideResponse(BaseModel):
    """Single slide in a post"""
    slide_number: int
    background: BackgroundConfig
    elements: List[TextElementResponse]
    image_prompt: Optional[str] = None


class LayoutConfig(BaseModel):
    """Post layout configuration"""
    aspect_ratio: str = "9:16"
    width: int = 1080
    height: int = 1080


class PostContentResponse(BaseModel):
    """Full post content (slides + caption + hashtags)"""
    slides: List[PostSlideResponse]
    layout: LayoutConfig
    caption: str
    hashtags: List[str]


# ═════════════════════════════════════════════════
#  Inbound DTOs (Request Schemas)
# ═════════════════════════════════════════════════

class GeneratePostRequest(BaseModel):
    """Request to generate new post from template"""
    brand_id: str
    template_id: str
    topic: str = Field(min_length=1, max_length=500)
    count: int = Field(ge=1, le=10, default=1)
    platform: Literal["instagram", "tiktok"] = "instagram"
    scheduled_time: Optional[datetime] = None
    variant_set_id: Optional[str] = None


class PostCreate(BaseModel):
    """Create a post with generated content"""
    brand_id: str
    template_id: str
    platform: Literal["instagram", "tiktok", "reels", "youtube_shorts"]
    content: PostContentResponse
    scheduled_time: Optional[datetime] = None
    variant_set_id: Optional[str] = None


class PostUpdate(BaseModel):
    """Update post - all fields optional"""
    status: Optional[Literal["draft", "scheduled", "posted", "failed", "archived"]] = None
    scheduled_time: Optional[datetime] = None
    content: Optional[PostContentResponse] = None
    post_metadata: Optional[dict] = None


# ═════════════════════════════════════════════════
#  Outbound DTOs (Response Schemas)
# ═════════════════════════════════════════════════

class PostResponse(BaseModel):
    """Full post details"""
    id: str
    brand_id: str
    template_id: str
    platform: str
    status: str
    
    content: PostContentResponse
    storage_urls: dict  # slide URLs, thumbnail URL
    rendering_status: str
    
    scheduled_time: Optional[datetime]
    published_time: Optional[datetime]
    
    variant_set_id: Optional[str]
    post_metadata: dict
    analytics: dict
    
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class PostListResponse(BaseModel):
    """Minimal post info for list views"""
    id: str
    brand_id: str
    template_id: str
    platform: str
    status: str
    
    rendering_status: str
    
    scheduled_time: Optional[datetime]
    published_time: Optional[datetime]
    
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class GeneratePostResponse(BaseModel):
    """Response from post generation request"""
    posts: List[PostResponse] = Field(description="Generated post(s)")
    message: str = "Content generated successfully"
    credit_warning: Optional[str] = None
    credit_info: Optional[dict] = None


# ═════════════════════════════════════════════════
#  Legacy Slide-related Models
# ═════════════════════════════════════════════════

class TextAlign(str, Literal["left", "center", "right"]):
    """Text alignment enum"""
    pass

class FontStyle(str, Literal["normal", "italic", "bold"]):
    """Font style enum"""
    pass

class TextElement(BaseModel):
    """Text element in a slide"""
    id: str
    type: Literal["text"] = "text"
    content: str
    font_size: int
    font_family: str
    font_style: str = "normal"  # TextAlign enum
    color: str
    x: float
    y: float
    width: float
    align: str = "left"  # FontStyle enum
    # Stroke properties
    stroke: Optional[str] = None
    stroke_width: Optional[float] = None
    # Shadow properties
    shadow_color: Optional[str] = None
    shadow_blur: Optional[float] = None
    shadow_offset_x: Optional[float] = None
    shadow_offset_y: Optional[float] = None
    shadow_opacity: Optional[float] = None
    # Additional text properties
    letter_spacing: Optional[float] = None
    line_height: Optional[float] = None

class SlideDesign(BaseModel):
    """Slide design template"""
    id: str
    name: str
    background: BackgroundConfig
    elements: List[TextElement]
    dynamic: bool = False

class SlideSequence(BaseModel):
    """Slide sequence reference"""
    slide_number: int
    design_id: str

class PostSlide(BaseModel):
    """Individual slide in a post"""
    slide_number: int
    design_id: str
    background: BackgroundConfig
    dynamic: bool
    elements: List[TextElement]
    image_prompt: Optional[str] = None

class PostContent(BaseModel):
    """
    LEGACY: Full post content model (slides + layout + caption + hashtags)
    Represents the complete structure of a generated post.
    """
    slides: List[PostSlide]
    layout: LayoutConfig
    caption: str
    hashtags: List[str]
