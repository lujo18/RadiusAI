# Compatibility shim: re-export functions from legacy backend.services path
from backend.services.integrations.supabase.db.platformIntegration import *

__all__ = [
    "getIntegrationById",
    "getIntegrationsByBrandId",
    "getIntegrationsByPlatform",
    "createIntegration",
    "updateIntegration",
    "deleteIntegration",
]
