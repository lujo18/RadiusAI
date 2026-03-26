"""
DEPRECATED: This file is a legacy repository. Use repository.py instead.

This module is kept for backwards compatibility only.
All team repository operations should use the TeamRepository from repository.py
"""

# Re-export from canonical location for backwards compatibility
from app.features.team.repository import TeamRepository

__all__ = ["TeamRepository"]