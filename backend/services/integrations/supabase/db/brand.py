from datetime import datetime
from typing import List, Literal

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
      access_token (str): OAuth access token.
      refresh_token (str, optional): OAuth refresh token.
      expires_at (datetime, optional): Token expiration time.
    """
    supabase = get_supabase()
    now = datetime.now().isoformat()

    data = {
        "brand_id": brand_id,
        "platform": platform,
        "late_account_id": late_account_id,
        "pfm_account_id": post_for_me_account_id,
        "username": username,
        "profile_picture_url": profile_picture_url,
        "user_id": user_id,
        "status": "connected",
        "updated_at": now,
        "created_at": now,
    }

    # Use upsert to ensure only one integration per (brand_id, platform).
    # Requires a DB unique constraint on (brand_id, platform).
    res = (
        supabase.table("platform_integrations")
        .upsert(data, on_conflict="brand_id,platform")
        .execute()
    )
    if getattr(res, "error", None):
        # Fall back to insert on unexpected error
        ins_res = supabase.table("platform_integrations").insert(data).execute()
        print(
            f"Connected {platform} account {late_account_id} to profile {brand_id} (insert fallback)"
        )
        return ins_res.data[0] if ins_res.data else None

    print(f"Upserted {platform} integration for profile {brand_id}")
    return res.data[0] if res.data else None


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
    print(f"Disconnected account {pfm_account_id}")
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
