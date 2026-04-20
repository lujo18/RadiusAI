"""Compatibility exports for legacy `models.user` imports used in tests.

Re-export `BrandSettings` from the canonical location.
"""

from app.features.user.schemas import BrandSettings

__all__ = ["BrandSettings"]
