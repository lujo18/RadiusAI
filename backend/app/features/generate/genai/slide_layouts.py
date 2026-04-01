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


SLIDE_CONSTANTS: dict[str, TextElement] = {
    "header_text": {
        "id": "header-text",
        "type": "text",
        "content": "Header text here. Introduce content, (100 character hard limit)",
        "font_size": 55,
        "font_family": "Tiktok Sans",
        "font_style": "bold",
        "color": "#ffffff",
        "x": 100,
        "y": 400,
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
    "body_text": {
        "id": "body-text",
        "type": "text",
        "content": "Body text here. Elaborate on content. (800 character hard limit)",
        "font_size": 48,
        "font_family": "Tiktok Sans",
        "font_style": "normal",
        "color": "#ffffff",
        "x": 100,
        "y": 700,
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
}


SLIDE_LAYOUTS: dict[str, SlideLayout] = {
    "hook": {
        "name": "hook",
        "text_elements": [
            {
                "id": "hook-text",
                "type": "text",
                "content": "Hook text here.",
                "font_size": 48,
                "font_family": "Tiktok Sans",
                "font_style": "bold",
                "color": "#ffffff",
                "x": 100,
                "y": 600,
            }
        ],
    },
    "header_and_body": {
        "name": "header_and_body",
        "text_elements": [
            SLIDE_CONSTANTS["header_text"],
            SLIDE_CONSTANTS["body_text"],
        ],
    },
    "header": {"name": "header", "text_elements": [SLIDE_CONSTANTS["header_text"]]},
}


def get_all_layout_schemas() -> dict[str, dict[str, dict[str, str]] | None]:
    """
    Return all available slide layouts with schema definitions.
    Used to build prompts for layout-agnostic generation.
    """
    return {name: {"template": str(layout)} for name, layout in SLIDE_LAYOUTS.items()}
