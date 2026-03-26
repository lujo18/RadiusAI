"""
FastAPI dependency injection utilities
"""

from app.core.security import get_current_user
from app.core.database import get_db

__all__ = [
    "get_current_user",  # Auth dependency
    "get_db",            # Database dependency
]

