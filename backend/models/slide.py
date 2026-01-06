# Modals for slides (types)

from pydantic import BaseModel, Field
from typing import List, Literal, Optional, Dict, Any, Tuple
from enum import Enum


class TextAlign(str, Enum):
    LEFT = "left"
    CENTER = "center"
    RIGHT = "right"

class FontStyle(str, Enum):
    NORMAL = "normal"
    ITALIC = "italic"
    BOLD = "bold"

class BackgroundType(str, Enum):
    SOLID = "solid"
    GRADIENT = "gradient"
    IMAGE = "image"

class BackgroundConfig(BaseModel):
    type: BackgroundType
    color: Optional[str] = None
    image_url: Optional[str] = None
    gradient_colors: Optional[Tuple[str, str]] = None
    gradient_angle: Optional[float] = None

class TextElement(BaseModel):
    id: str
    type: Literal["text"] = "text"
    content: str
    font_size: int
    font_family: str
    font_style: FontStyle = FontStyle.NORMAL
    color: str
    x: float
    y: float
    width: float
    align: TextAlign = TextAlign.LEFT
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
    id: str
    name: str
    background: BackgroundConfig
    elements: List[TextElement]
    dynamic: bool = False
    
class SlideSequence(BaseModel):
    slide_number: int
    design_id: str

class LayoutConfig(BaseModel):
    aspect_ratio: str = "1:1"
    width: int = 1080
    height: int = 1080

class PostSlide(BaseModel):
    slide_number: int
    design_id: str
    background: BackgroundConfig
    dynamic: bool
    elements: List[TextElement]
    image_prompt: Optional[str] = None

class PostContent(BaseModel):
    slides: List[PostSlide]
    layout: LayoutConfig
    caption: str
    hashtags: List[str]