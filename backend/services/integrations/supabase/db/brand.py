from datetime import datetime
from typing import List, Literal
import uuid

from models.platform_integration import PlatformIntegration
from models.user import BrandSettings
from services.integrations.supabase.client import get_supabase


def create_supabase_brand(
    user_id: str,
    late_profile_id: str,
    brand_name: str,
    brand_description: str,
    brand_settings: BrandSettings,
):
    supabase = get_supabase()
    res = (
        supabase.table("profiles")
        .insert(
            {
                "user_id": user_id,
                "late_profile_id": late_profile_id,
                "name": brand_name,
                "description": brand_description,
                "created_at": datetime.now().isoformat(),
                "brand_settings": (
                    brand_settings.dict()
                    if hasattr(brand_settings, "dict")
                    else brand_settings
                ),
            }
        )
        .execute()
    )

    print(f"Profile created in Supabase: {res.data[0]['late_profile_id']}")
    return res.data[0]  # Return the profile


def connect_social_account_to_brand(
    brand_id: str,
    platform: str,
    username: str,
    profile_picture_url: str | None = None,
    late_account_id: str | None = None,
    post_for_me_account_id: str | None = None,
    user_id: str | None = None,
):
    """
    Connects a social media account integration to a profile in Supabase.

    Args:
      user_id (str): The user who owns account
      brand_id (str): The profile's late_profile_id.
      platform (str): The social media platform (e.g., 'instagram', 'tiktok').
      late_account_id (str): The social account's unique ID.
      post_for_me_account_id: PostForMe account ID
      username (str): Social account username
      profile_picture_url (str, optional): Profile picture URL
    """
    supabase = get_supabase()
    now = datetime.now().isoformat()

    data = {
        "id": str(uuid.uuid4()),  # Generate UUID for new rows (required for upsert insert)
        "brand_id": brand_id,
        "platform": platform,
        "pfm_account_id": post_for_me_account_id,
        "username": username,
        "profile_picture_url": profile_picture_url,
        "status": "connected",
        "user_id": user_id,  # Include user_id if provided
        "updated_at": now,
        "created_at": now,
    }

    # Use upsert to ensure only one integration per (brand_id, platform).
    # Requires a DB unique constraint on (brand_id, platform).

    print("UPDATING SUPABASE ROW", data)
    try:
        res = (
            supabase.table("platform_integrations")
            .upsert(data, on_conflict="brand_id,platform")
            .execute()
        )
        print(f"Upserted {platform} integration for profile {brand_id}")
        return res.data[0] if res.data else None
    except Exception as e:
        print(f"Error upserting integration: {e}")
        print(f"Data that failed: {data}")
        raise


def update_social_account_status(
    pfm_account_id: str, status: Literal["connected", "disconnected"]
):
    supabase = get_supabase()

    res = (
        supabase.table("platform_integrations")
        .update({"status": status})
        .eq("pfm_account_id", pfm_account_id)
        .execute()
    )
    print(f"UPDATE: {status} account {pfm_account_id}")
    return res.data[0] if res.data else None


def get_social_accounts(brand_id: str, platforms: List[str]) -> List[PlatformIntegration]:
    supabase = get_supabase()

    res = (
      supabase.table("platform_integrations")
      .select("*")
      .eq("brand_id", brand_id)
      .in_("platform", platforms)
      .execute()
    )

    if getattr(res, "error", None):
        print("error fetching integrations", res)
        return []

    data = res.data or []
    integrations: List[PlatformIntegration] = []
    for item in data:
        try:
            integrations.append(PlatformIntegration(**item))
        except Exception as e:
            # Skip malformed items but log for debugging
            print("Failed to parse integration item:", item, e)

    print("integrations", integrations)
    return integrations
