from typing import List, Optional
from backend.features.error.helper import api_error
from models.platform_integration import PlatformIntegration
from services.integrations.supabase.client import get_supabase


def getIntegrationById(integration_id: str) -> Optional[PlatformIntegration]:
    """Get a single platform integration by ID"""
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
            return PlatformIntegration(**response.data)
        return None
    except Exception as e:
        msg = str(e)
        if 'PGRST116' in msg or 'Cannot coerce' in msg:
            return None
        api_error(500, "DB_ERROR", f"Error fetching integration {integration_id}: {msg}")


def getIntegrationsByBrandId(brand_id: str) -> List[PlatformIntegration]:
    """Get all platform integrations for a brand"""
    try:
        supabase = get_supabase()
        response = (
            supabase.table("platform_integrations")
            .select("*")
            .eq("brand_id", brand_id)
            .execute()
        )
        if response.data:
            return [PlatformIntegration(**item) for item in response.data]
        return []
    except Exception as e:
        api_error(500, "DB_ERROR", f"Error fetching integrations for brand {brand_id}: {e}")


def getIntegrationsByPlatform(brand_id: str, platform: str) -> List[PlatformIntegration]:
    """Get all platform integrations for a brand on a specific platform"""
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
            return [PlatformIntegration(**item) for item in response.data]
        return []
    except Exception as e:
        api_error(500, "DB_ERROR", f"Error fetching {platform} integrations for brand {brand_id}: {e}")


def createIntegration(integration: PlatformIntegration) -> Optional[PlatformIntegration]:
    """Create a new platform integration"""
    try:
        supabase = get_supabase()
        integration_dict = integration.dict(exclude_none=True)
        response = (
            supabase.table("platform_integrations")
            .insert(integration_dict)
            .execute()
        )
        if response.data:
            return PlatformIntegration(**response.data[0])
        api_error(500, "DB_WRITE_FAILED", "Failed to create integration: no data returned")
    except Exception as e:
        api_error(500, "DB_ERROR", f"Error creating integration: {e}")


def updateIntegration(integration_id: str, updates: dict) -> Optional[PlatformIntegration]:
    """Update a platform integration"""
    try:
        supabase = get_supabase()
        response = (
            supabase.table("platform_integrations")
            .update(updates)
            .eq("id", integration_id)
            .execute()
        )
        if response.data:
            return PlatformIntegration(**response.data[0])
        api_error(500, "DB_WRITE_FAILED", f"Failed to update integration {integration_id}: no data returned")
    except Exception as e:
        api_error(500, "DB_ERROR", f"Error updating integration {integration_id}: {e}")


def deleteIntegration(integration_id: str) -> bool:
    """Delete a platform integration"""
    try:
        supabase = get_supabase()
        response = (
            supabase.table("platform_integrations")
            .delete()
            .eq("id", integration_id)
            .execute()
        )
        return True
    except Exception as e:
        api_error(500, "DB_ERROR", f"Error deleting integration {integration_id}: {e}")
