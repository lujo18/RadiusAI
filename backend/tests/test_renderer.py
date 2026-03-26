"""
Test script for Pillow slide renderer
"""
import sys
from pathlib import Path

# Add parent directory to path so we can import backend module
sys.path.insert(0, str(Path(__file__).parent.parent))

from models.slide import PostSlide, TextElement, BackgroundConfig, TextAlign, FontStyle, BackgroundType
from app.features.posts.utilities.renderSlides import SlideRenderer

# Create a test slide with header_and_body layout (matching slide_layouts.py)
test_slide = PostSlide(
    slide_number=1,
    design_id="test-1",
    background=BackgroundConfig(
        type=BackgroundType.IMAGE,
        image_url="https://images.unsplash.com/photo-1700393879677-663e8475bf70?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    ),
    dynamic=False,
    elements=[
        # Header text
        TextElement(
            id="text-1767736354031",
            type="text",
            content="1) 21-Day No-Complaint Experiment",
            font_size=55,
            font_family="Tiktok Sans",
            font_style=FontStyle.BOLD,
            color="#ffffff",
            x=100,
            y=400,
            width=880,
            align=TextAlign.CENTER,
            stroke="#000000",
            stroke_width=4,
            shadow_color="#000000",
            shadow_blur=6,
            shadow_offset_x=0,
            shadow_offset_y=2,
            shadow_opacity=0.5,
            line_height=1.3,
        ),
        # Body text
        TextElement(
            id="text-1767738943620",
            type="text",
            content="Try going 21 days without complaining, gossiping, or criticizing. If you slip, you start overe It helps you stay more positive and mindfulevery day.",
            font_size=48,
            font_family="Tiktok Sans",
            font_style=FontStyle.NORMAL,
            color="#ffffff",
            x=100,
            y=700,
            width=880,
            align=TextAlign.CENTER,
            stroke="#000000",
            stroke_width=4,
            shadow_color="#000000",
            shadow_blur=6,
            shadow_offset_x=0,
            shadow_offset_y=2,
            shadow_opacity=0.5,
            line_height=1.3,
        )
    ],
    image_prompt=None
)

# Render the slide
renderer = SlideRenderer(width=1080, height=1920, padding=80)
png_bytes = renderer.render_slide(test_slide)

# Save to file for inspection
with open("test_slide_output.png", "wb") as f:
    f.write(png_bytes)
    
print(f"✅ Rendered test slide: {len(png_bytes)} bytes")
print(f"📁 Saved to: test_slide_output.png")
