# Backwards compatibility shim for social integration services
# Re-export selected utilities from legacy services
from app.lib.social.postforme.analytics_client import (
    get_postforme_analytics_client,
)
from app.lib.social.postforme.social_account import make_post

__all__ = ["get_postforme_analytics_client", "make_post"]
