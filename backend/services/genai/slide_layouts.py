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
        "id": "text-1767736354031",
        "type": "text",
        "content": "Header text here",
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
        "id": "text-1767738943620",
        "type": "text",
        "content": "Body text here",
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
    }
}

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
                "font_family": "Tiktok Sans",
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
            SLIDE_CONSTANTS["header_text"],
            SLIDE_CONSTANTS["body_text"],
        ],
    },
    "header": {
        "name": "header",
        "text_elements": [
            SLIDE_CONSTANTS["header_text"]
        ],
    },
    "body": {
        "name": "body",
        "text_elements": [
            SLIDE_CONSTANTS["body_text"]
        ],
    },
}


def get_slide_layout(layout_type: str) -> SlideLayout | None:
    """Get a slide layout by type"""
    return SLIDE_LAYOUTS.get(layout_type)


def get_available_layouts() -> list[str]:
    """Get list of available layout types"""
    return list(SLIDE_LAYOUTS.keys())


def get_layout_text_fields(layout_type: str) -> dict[str, dict[str, str]] | None:
    """
    Get text element IDs and their placeholder content for a layout.
    
    Returns: {"text-123": "Hook text here", "text-456": "Body text here"}
    Useful for AI prompts - only returns what needs to be filled.
    """
    layout = SLIDE_LAYOUTS.get(layout_type)
    if not layout:
        return None
    
    return {
        element["id"]: {
            "content": element["content"],
            "role": None # Todo: add text roles for better generation
        }
        for element in layout["text_elements"]
    }


def get_all_layout_schemas() -> dict[str, dict[str, dict[str, str]] | None]:
    """
    Get text field schemas for all layouts.
    
    Returns:
    {
        "hook": {"text-123": "Hook text here"},
        "header_and_body": {"text-123": "Header text here", "text-456": "Body text here"}
    }
    
    Perfect for AI prompts - shows available layouts and required text fields.
    """
    return {
        layout_type: get_layout_text_fields(layout_type)
        for layout_type in SLIDE_LAYOUTS.keys()
    }


def fill_layout_with_content(layout_type: str, content_map: dict[str, str]) -> SlideLayout | None:
    """
    Fill a layout template with actual content.
    
    Args:
        layout_type: Type of layout to use
        content_map: Mapping of text element IDs to content
                    {"text-123": "My awesome hook", "text-456": "Body content"}
    
    Returns:
        Complete SlideLayout with content filled in
    """
    import copy
    layout = get_slide_layout(layout_type)
    if not layout:
        return None
    
    # Deep copy to avoid mutating template
    filled_layout = copy.deepcopy(layout)
    
    # Fill in content for each text element
    for element in filled_layout["text_elements"]:
        if element["id"] in content_map:
            element["content"] = content_map[element["id"]]
    
    return filled_layout