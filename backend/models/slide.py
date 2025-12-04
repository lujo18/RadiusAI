# Modals for slides (types)

from pydantic import BaseModel, Field
from typing import List, Literal, Optional, Dict, Any
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

class ColorStop(BaseModel):
    color: str
    offset: float = Field(ge=0, le=1)

class BackgroundConfig(BaseModel):
    type: BackgroundType
    color: Optional[str] = None
    imageUrl: Optional[str] = None
    colorStops: Optional[List[ColorStop]] = None

class TextElement(BaseModel):
    id: str
    type: Literal["text"] = "text"
    content: str
    x: float
    y: float
    width: Optional[float] = None
    height: Optional[float] = None
    fontSize: int
    fontFamily: str
    fontStyle: FontStyle = FontStyle.NORMAL
    fill: str
    align: TextAlign = TextAlign.LEFT
    rotation: float = 0
    draggable: bool = True

class SlideDesign(BaseModel):
    id: str
    name: str
    background: BackgroundConfig
    elements: List[TextElement]
    dynamic: bool = False
    
class SlideSequence(BaseModel):
    slideNumber: int
    designId: str

class LayoutConfig(BaseModel):
    aspectRatio: str = "1:1"
    width: int = 1080
    height: int = 1080

class PostSlide(BaseModel):
    slideNumber: int
    designId: str
    background: BackgroundConfig
    dynamic: bool
    elements: List[TextElement]
    imagePrompt: Optional[str] = None

class PostContent(BaseModel):
    slides: List[PostSlide]
    layout: LayoutConfig
    caption: str
    hashtags: List[str]