from typing import List, Optional
import logging

from app.features.integrations.supabase.client import get_supabase

# Try to import the canonical PlatformIntegration model from legacy models package.
# This keeps compatibility across different runtime import layouts.
try:
    from models.platform_integration import PlatformIntegration
except Exception:
    try:
        from backend.models.platform_integration import PlatformIntegration
    except Exception:
        PlatformIntegration = None

logger = logging.getLogger(__name__)


def _to_model(item: dict) -> Optional["PlatformIntegration"]:
    if item is None:
        return None
    if PlatformIntegration is None:
        # If the model isn't importable, return raw dict to preserve behavior
        return item
    try:
        return PlatformIntegration(**item)
    except Exception as e:
        logger.warning("Failed to construct PlatformIntegration model: %s; returning raw dict", e)
        return item


def getIntegrationById(integration_id: str) -> Optional["PlatformIntegration"]:
    """Get a single platform integration by ID and return a PlatformIntegration model."""
    try:
        supabase = get_supabase()
        response = (
            supabase.table("platform_integrations")
            .select("*")
            .eq("id", integration_id)
            .single()
            .execute()
        )
        if response.data:
            return _to_model(response.data)
        return None
    except Exception as e:
        logger.exception("Error fetching integration %s: %s", integration_id, e)
        return None


def getIntegrationsByBrandId(brand_id: str) -> List["PlatformIntegration"]:
    """Get all platform integrations for a brand and return a list of PlatformIntegration models."""
    try:
        supabase = get_supabase()
        response = (
            supabase.table("platform_integrations")
            .select("*")
            .eq("brand_id", brand_id)
            .execute()
        )
        if response.data:
            return [_to_model(item) for item in (response.data or [])]
        return []
    except Exception as e:
        logger.exception("Error fetching integrations for brand %s: %s", brand_id, e)
        return []


def getIntegrationsByPlatform(brand_id: str, platform: str) -> List["PlatformIntegration"]:
    """Get all platform integrations for a brand on a specific platform."""
    try:
        supabase = get_supabase()
        response = (
            supabase.table("platform_integrations")
            .select("*")
            .eq("brand_id", brand_id)
            .eq("platform", platform)
            .execute()
        )
        if response.data:
            return [_to_model(item) for item in (response.data or [])]
        return []
    except Exception as e:
        logger.exception("Error fetching %s integrations for brand %s: %s", platform, brand_id, e)
        return []


def createIntegration(integration: dict) -> Optional["PlatformIntegration"]:
    """Create a new platform integration and return the created PlatformIntegration model."""
    try:
        supabase = get_supabase()
        integration_dict = (
            integration.dict(exclude_none=True)
            if hasattr(integration, "dict")
            else integration
        )
        response = supabase.table("platform_integrations").insert(integration_dict).execute()
        if response.data:
            return _to_model(response.data[0])
        return None
    except Exception as e:
        logger.exception("Error creating integration: %s", e)
        return None


def updateIntegration(integration_id: str, updates: dict) -> Optional["PlatformIntegration"]:
    """Update a platform integration and return the updated PlatformIntegration model."""
    try:
        supabase = get_supabase()
        response = (
            supabase.table("platform_integrations")
            .update(updates)
            .eq("id", integration_id)
            .execute()
        )
        if response.data:
            return _to_model(response.data[0])
        return None
    except Exception as e:
        logger.exception("Error updating integration %s: %s", integration_id, e)
        return None


def deleteIntegration(integration_id: str) -> bool:
    """Delete a platform integration"""
    try:
        supabase = get_supabase()
        supabase.table("platform_integrations").delete().eq("id", integration_id).execute()
        return True
    except Exception as e:
        logger.exception("Error deleting integration %s: %s", integration_id, e)
        return False
