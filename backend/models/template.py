"""Compatibility shim exposing Template model used in tests.

Re-exports canonical `Template` from `app.features.templates.schemas`.
"""

from app.features.templates.schemas import Template

__all__ = ["Template"]
