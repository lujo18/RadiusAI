"""
AI Package - Gemini Integration for SlideForge

This package handles all AI-related functionality including:
- Gemini client initialization
- Content generation from templates
- Prompt engineering
- Response validation
"""

from .client import client
from .gemini_service import (
    generate_content_with_gemini,
)

__all__ = [
    'client',
    'generate_content_with_gemini',
    'generate_week_content',
    'generate_variant_set_content',
    'validate_gemini_response',
    'generate_prompt_from_template'
]
