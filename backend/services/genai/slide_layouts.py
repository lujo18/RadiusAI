"""
Slide Layout Templates for TikTok Content Generation

These are pre-built Konva-compatible slide layouts that define the structure
and design of different slide types (hook, header+body, etc.)
"""

from typing import TypedDict, Literal, Optional, List


class TextElement(TypedDict, total=False):
    """Text element structure matching frontend Konva format"""
    id: str
    type: Literal["text"]
    content: str
    font_size: int
    font_family: str
    font_style: Literal["normal", "bold", "italic"]
    color: str
    x: float
    y: float
    width: float
    align: Literal["left", "center", "right"]
    stroke: Optional[str]
    stroke_width: Optional[float]
    shadow_color: Optional[str]
    shadow_blur: Optional[float]
    shadow_offset_x: Optional[float]
    shadow_offset_y: Optional[float]
    shadow_opacity: Optional[float]
    line_height: Optional[float]
    letter_spacing: Optional[float]


class SlideLayout(TypedDict):
    """Slide layout structure"""
    name: str
    text_elements: List[TextElement]


# Slide layout definitions matching frontend SlideLayouts.ts
SLIDE_LAYOUTS: dict[str, SlideLayout] = {
    "hook": {
        "name": "hook",
        "text_elements": [
            {
                "id": "text-1767736354031",
                "type": "text",
                "content": "Hook text here",
                "font_size": 48,
                "font_family": "Proxima Nova, Inter, Arial",
                "font_style": "bold",
                "color": "#ffffff",
                "x": 100,
                "y": 600,
                "width": 880,
                "align": "center",
                "stroke": "#000000",
                "stroke_width": 4,
                "shadow_color": "#000000",
                "shadow_blur": 6,
                "shadow_offset_x": 0,
                "shadow_offset_y": 2,
                "shadow_opacity": 0.5,
                "line_height": 1.3,
            }
        ],
    },
    "header_and_body": {
        "name": "header_and_body",
        "text_elements": [
            {
                "id": "text-1767736354031",
                "type": "text",
                "content": "Header text here",
                "font_size": 55,
                "font_family": "Proxima Nova, Inter, Arial",
                "font_style": "bold",
                "color": "#ffffff",
                "x": 100,
                "y": 190,
                "width": 880,
                "align": "center",
                "stroke": "#000000",
                "stroke_width": 4,
                "shadow_color": "#000000",
                "shadow_blur": 6,
                "shadow_offset_x": 0,
                "shadow_offset_y": 2,
                "shadow_opacity": 0.5,
                "line_height": 1.3,
            },
            {
                "id": "text-1767738943620",
                "type": "text",
                "content": "Body text here",
                "font_size": 48,
                "font_family": "Inter",
                "font_style": "normal",
                "color": "#ffffff",
                "x": 100,
                "y": 500,
                "width": 880,
                "align": "center",
            },
        ],
    },
    "header": {
        "name": "header",
        "text_elements": [
            {
                "id": "text-1767736354031",
                "type": "text",
                "content": "Header text here",
                "font_size": 55,
                "font_family": "Proxima Nova, Inter, Arial",
                "font_style": "bold",
                "color": "#ffffff",
                "x": 100,
                "y": 190,
                "width": 880,
                "align": "center",
                "stroke": "#000000",
                "stroke_width": 4,
                "shadow_color": "#000000",
                "shadow_blur": 6,
                "shadow_offset_x": 0,
                "shadow_offset_y": 2,
                "shadow_opacity": 0.5,
                "line_height": 1.3,
            }
        ],
    },
    "body": {
        "name": "body",
        "text_elements": [
            {
                "id": "text-1767738943620",
                "type": "text",
                "content": "Body text here",
                "font_size": 48,
                "font_family": "Inter",
                "font_style": "normal",
                "color": "#ffffff",
                "x": 100,
                "y": 500,
                "width": 880,
                "align": "center",
            }
        ],
    },
}


def get_slide_layout(layout_type: str) -> SlideLayout | None:
    """Get a slide layout by type"""
    return SLIDE_LAYOUTS.get(layout_type)


def get_available_layouts() -> list[str]:
    """Get list of available layout types"""
    return list(SLIDE_LAYOUTS.keys())