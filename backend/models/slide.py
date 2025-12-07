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
    imageUrl: Optional[str] = None
    gradientColors: Optional[Tuple[str, str]] = None
    gradientAngle: Optional[float] = None

class TextElement(BaseModel):
    id: str
    type: Literal["text"] = "text"
    content: str
    role: Optional[str] = None  # e.g., "header", "body", "cta"
    fontSize: int
    fontFamily: str
    fontStyle: FontStyle = FontStyle.NORMAL
    color: str
    x: float
    y: float
    width: Optional[float] = None
    align: TextAlign = TextAlign.LEFT
    #rotation: float # TODO: Text rotation could be a potential quality of life feature but isn't worth implementing yet
   
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