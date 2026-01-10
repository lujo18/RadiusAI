"""
Test script for Pillow slide renderer
"""
import sys
from pathlib import Path

# Add parent directory to path so we can import backend module
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.models.slide import PostSlide, TextElement, BackgroundConfig, TextAlign, FontStyle, BackgroundType
from backend.services.pillow.renderSlides import SlideRenderer

# Create a test slide
test_slide = PostSlide(
    slide_number=1,
    design_id="test-1",
    background=BackgroundConfig(
        type=BackgroundType.GRADIENT,
        gradient_colors=("#0B0B0C", "#1a1a1a"),
        gradient_angle=0
    ),
    dynamic=False,
    elements=[
        TextElement(
            id="text-1",
            type="text",
            content="Hello from Pillow!\nThis is a test slide with auto-wrapping text that should look identical to Konva.",
            font_size=48,
            font_family="Tiktok Sans",  # Using TikTok Sans
            font_style=FontStyle.BOLD,
            color="#F8FAFC",
            x=80,
            y=860,  # Centered vertically around 960 (1920/2)
            width=920,  # 1080 - 160 padding
            align=TextAlign.CENTER,
            line_height=1.5
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
