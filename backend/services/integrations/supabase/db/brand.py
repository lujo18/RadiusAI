from datetime import datetime
from typing import List, Literal

from backend.features.error.helper import api_error
from models.platform_integration import PlatformIntegration
from models.user import BrandSettings
from services.integrations.supabase.client import get_supabase


def create_supabase_brand(
    user_id: str,
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
    post_for_me_account_id: str | None = None,
    user_id: str | None = None,
    # TikTok direct fields
    tiktok_open_id: str | None = None,
    tiktok_access_token: str | None = None,
    tiktok_refresh_token: str | None = None,
    tiktok_token_expires_at: str | None = None,
    tiktok_refresh_expires_at: str | None = None,
    # Extra profile metadata
    bio: str | None = None,
    followers_count: int | None = None,
    following_count: int | None = None,
):
    """
    Connects a social media account integration to a profile in Supabase.

    Args:
      user_id (str): The user who owns account
      brand_id (str): The profile's late_profile_id.
      platform (str): The social media platform (e.g., 'instagram', 'tiktok').
      tiktok_* : TikTok direct OAuth token fields (populated for TikTok connections).
    """
    supabase = get_supabase()
    now = datetime.now().isoformat()

    data: dict = {
        "brand_id": brand_id,
        "platform": platform,
        "pfm_account_id": post_for_me_account_id,
        "username": username,
        "profile_picture_url": profile_picture_url,
        "status": "connected",
        "updated_at": now,
        "created_at": now,
    }

    # Only include TikTok token fields when they are actually provided so we
    # don't accidentally overwrite existing PostForMe rows with null values.
    if tiktok_open_id is not None:
        data["tiktok_open_id"] = tiktok_open_id
    if tiktok_access_token is not None:
        data["tiktok_access_token"] = tiktok_access_token
    if tiktok_refresh_token is not None:
        data["tiktok_refresh_token"] = tiktok_refresh_token
    if tiktok_token_expires_at is not None:
        data["tiktok_token_expires_at"] = tiktok_token_expires_at
    if tiktok_refresh_expires_at is not None:
        data["tiktok_refresh_expires_at"] = tiktok_refresh_expires_at
    if bio is not None:
        data["bio"] = bio
    if followers_count is not None:
        data["followers_count"] = followers_count
    if following_count is not None:
        data["following_count"] = following_count
    if user_id is not None:
        data["user_id"] = user_id

    # Use upsert to ensure only one integration per (brand_id, platform).
    # Requires a DB unique constraint on (brand_id, platform).
    
    print("UPDATING SUPABASE ROW", data)
    res = (
        supabase.table("platform_integrations")
        .upsert(data, on_conflict="brand_id,platform")
        .execute()
    )

    if not res.data:
        api_error(500, "DB_WRITE_FAILED", f"Failed to upsert {platform} integration for brand {brand_id}")

    print(f"Upserted {platform} integration for profile {brand_id}")
    return res.data[0]


def update_social_account_status(
    integration_id: str, status: Literal["connected", "disconnected"]
):
    supabase = get_supabase()

    res = (
        supabase.table("platform_integrations")
        .update({"status": status})
        .eq("id", integration_id)
        .execute()
    )
    if not res.data:
        api_error(404, "INTEGRATION_NOT_FOUND", f"No integration found for id {integration_id}")
    return res.data[0]


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
        api_error(500, "DB_ERROR", f"Error fetching integrations for brand {brand_id}: {res.error}")

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
