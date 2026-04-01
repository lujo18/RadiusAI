"""Compatibility types for the usage feature.

This module provides a small, stable shape used by older imports
that reference `app.features.usage.types.EMPTY_USAGE`.
"""

EMPTY_USAGE = {
    "credits": {"total": 0, "text_generation": 0},
    "post_count": 0,
    "slides_generated": 0,
}
