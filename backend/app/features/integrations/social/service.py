# Backwards compatibility shim for social integration services
# Re-export selected utilities from legacy services
from backend.services.integrations.social.postforme.analytics_client import (
    get_postforme_analytics_client,
)

__all__ = ["get_postforme_analytics_client"]
