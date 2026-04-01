from typing import List, Optional
from app.features.integrations.supabase.client import get_supabase


def getIntegrationById(integration_id: str) -> Optional[dict]:
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
            return response.data
        return None
    except Exception as e:
        print(f"Error fetching integration {integration_id}: {e}")
        return None


def getIntegrationsByBrandId(brand_id: str) -> List[dict]:
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
            return [item for item in response.data]
        return []
    except Exception as e:
        print(f"Error fetching integrations for brand {brand_id}: {e}")
        return []


def getIntegrationsByPlatform(brand_id: str, platform: str) -> List[dict]:
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
            return [item for item in response.data]
        return []
    except Exception as e:
        print(f"Error fetching {platform} integrations for brand {brand_id}: {e}")
        return []


def createIntegration(integration: dict) -> Optional[dict]:
    """Create a new platform integration"""
    try:
        supabase = get_supabase()
        integration_dict = (
            integration.dict(exclude_none=True)
            if hasattr(integration, "dict")
            else integration
        )
        response = (
            supabase.table("platform_integrations").insert(integration_dict).execute()
        )
        if response.data:
            return response.data[0]
        return None
    except Exception as e:
        print(f"Error creating integration: {e}")
        return None


def updateIntegration(integration_id: str, updates: dict) -> Optional[dict]:
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
            return response.data[0]
        return None
    except Exception as e:
        print(f"Error updating integration {integration_id}: {e}")
        return None


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
        print(f"Error deleting integration {integration_id}: {e}")
        return False
