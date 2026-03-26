# Bridge for Unsplash client - Re-exports from new feature location
from app.features.integrations.unsplash.client import api, auth

__all__ = ["api", "auth"]
