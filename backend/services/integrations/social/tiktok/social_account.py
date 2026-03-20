
"""
TikTok social account operations: OAuth connect, save, disconnect, and post routing.

This module is the direct equivalent of postforme/social_account.py but drives
TikTok's own Content Posting API instead of PostForMe.

OAuth flow:
  1. create_auth_url()   → redirect user to TikTok consent page
  2. save_integration()  → exchange ?code= + decode ?state=, store tokens in Supabase
  3. disconnect_integration() → revoke token, mark row as disconnected

Publishing is delegated to the publish/ sub-package:
  make_post() → publish/slideshow.py  (media_type PHOTO, carousel of images)
             → publish/video.py       (media_type VIDEO, single video file)
"""

from datetime import datetime, timezone, timedelta
from typing import Any, List, Literal, Optional
from urllib.parse import urlencode

from backend.features.error.helper import api_error
from backend.features.error.response import SuccessResponse
from config import Config
from services.integrations.social.social_provider import (
    CreateAuthUrlResponse,
    SaveIntegrationResponse,
)
from services.integrations.supabase.db.post import get_post, update_post
from services.integrations.supabase.db.brand import (
    connect_social_account_to_brand,
    get_social_accounts,
    update_social_account_status,
)
from util.generate_state import generate_state
from util.decode_state import decode_state
from .client import TikTokClient, TikTokAPIError
from .token_manager import get_valid_token, make_refresh_fn, TokenError

# ---------------------------------------------------------------------------
# Required TikTok OAuth scopes
# ---------------------------------------------------------------------------
TIKTOK_SCOPES = ",".join(
    [
        "user.info.basic",
        "user.info.profile",
        "user.info.stats",
        "video.list",
        "video.upload",
    ]
)


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------


async def create_auth_url(
    platform: str,
    user_id: str,
    brand_id: str,
    existing_profile_id: str = "",
) -> CreateAuthUrlResponse:
    """
    Build a TikTok /v2/auth/authorize/ URL and return it.
    The `state` JWT carries brand_id + user_id through the OAuth round-trip
    so the callback can write to the right Supabase row.
    """
    client_key = Config.TIKTOK_CLIENT_KEY
    redirect_uri = Config.TIKTOK_REDIRECT_URI

    if not client_key:
        api_error(500, "CONFIG_ERROR", "TIKTOK_CLIENT_KEY is not configured")
    if not redirect_uri:
        api_error(500, "CONFIG_ERROR", "TIKTOK_REDIRECT_URI is not configured")

    state = generate_state(brand_id=brand_id, user_id=user_id)

    params = {
        "client_key": client_key,
        "scope": TIKTOK_SCOPES,
        "response_type": "code",
        "redirect_uri": redirect_uri,
        "state": state,
    }

    auth_url = f"https://www.tiktok.com/v2/auth/authorize/?{urlencode(params)}"

    return CreateAuthUrlResponse(
        authUrl=auth_url,
        platform=platform,
        message="Redirect the user to authUrl to authorize TikTok access.",
    )


async def save_integration(response: dict) -> SaveIntegrationResponse:
    """
    Complete the OAuth flow after TikTok redirects back with ?code=&state=.

    Args:
        response: Dict of all query parameters from the TikTok callback URL.
                  Must include 'code' and 'state'.
    """
    code: str = response.get("code", "")
    state: str = response.get("state", "")

    if not code or not state:
        api_error(400, "MISSING_PARAMS", "TikTok callback missing 'code' or 'state' parameters")

    # Decode CSRF state → {brandId, userId}
    payload = decode_state(state)
    brand_id: str = payload["brandId"]
    user_id: str = payload["userId"]

    client_key = Config.TIKTOK_CLIENT_KEY
    client_secret = Config.TIKTOK_CLIENT_SECRET
    redirect_uri = Config.TIKTOK_REDIRECT_URI

    # Exchange code for tokens
    token_data = await TikTokClient.exchange_code(
        client_key=client_key,
        client_secret=client_secret,
        code=code,
        redirect_uri=redirect_uri,
    )

    access_token: str = token_data["access_token"]
    refresh_token: str = token_data.get("refresh_token", "")
    open_id: str = token_data.get("open_id", "")
    expires_in: int = token_data.get("expires_in", 86400)
    refresh_expires_in: int = token_data.get("refresh_expires_in", 2592000)

    now = datetime.now(timezone.utc)
    token_expires_at = (now + timedelta(seconds=expires_in)).isoformat()
    refresh_expires_at = (now + timedelta(seconds=refresh_expires_in)).isoformat()

    # Fetch basic user profile
    client = TikTokClient(access_token)
    try:
        user_data = await client.get(
            "/user/info/",
            fields="open_id,union_id,avatar_url,display_name,bio_description,profile_deep_link,follower_count,following_count,likes_count",
        )
    except TikTokAPIError:
        user_data = {}

    user_info = user_data.get("data", {}).get("user", {})
    username: str = user_info.get("display_name", open_id)
    avatar: Optional[str] = user_info.get("avatar_url")
    bio: Optional[str] = user_info.get("bio_description")
    followers_count: Optional[int] = user_info.get("follower_count")
    following_count: Optional[int] = user_info.get("following_count")

    # Upsert into platform_integrations (brand_id + platform unique constraint)
    connect_social_account_to_brand(
        brand_id=brand_id,
        platform="tiktok",
        username=username,
        profile_picture_url=avatar,
        user_id=user_id,
        # TikTok-specific token fields
        tiktok_open_id=open_id,
        tiktok_access_token=access_token,
        tiktok_refresh_token=refresh_token,
        tiktok_token_expires_at=token_expires_at,
        tiktok_refresh_expires_at=refresh_expires_at,
        # Profile metadata
        bio=bio,
        followers_count=followers_count,
        following_count=following_count,
    )

    return SaveIntegrationResponse(
        brand_id=brand_id,
        platform_connected="tiktok",
    )


async def disconnect_integration(integration_id: str) -> SuccessResponse:
    """
    Revoke TikTok token and mark integration as disconnected in Supabase.
    """
    from services.integrations.supabase.client import get_supabase

    try:
        supabase = get_supabase()
        res = (
            supabase.table("platform_integrations")
            .select("tiktok_access_token")
            .eq("id", integration_id)
            .single()
            .execute()
        )
        
    except Exception as exc:
        api_error(status_code=400, code="INTEGRATION_RETRIEVAL_FAILED", message=str(exc))

        
    row = res.data

    if row and row.get("tiktok_access_token"):
        try:
            await TikTokClient.revoke_token(
                client_key=Config.TIKTOK_CLIENT_KEY,
                client_secret=Config.TIKTOK_CLIENT_SECRET,
                token=str(row.get("tiktok_access_token")),
            )
        except Exception as exc:
            # Log but don't block – we still want to mark as disconnected
            print(f"[TikTok] Token revoke failed (continuing): {exc}")

    update_social_account_status(integration_id, "disconnected")
    return SuccessResponse(data={"disconnected": True})


# ---------------------------------------------------------------------------
# Publishing router
# ---------------------------------------------------------------------------


async def make_post(
    brand_id: str,
    platforms: List[str],
    post_id: str,
    mode: Literal["draft", "scheduled", "publish"] = "publish",
    scheduled_at: Optional[str] = None,
    post_type: Literal["slideshow", "video"] = "slideshow",
    tiktok_disclosure_options: Optional[dict] = None,
) -> SuccessResponse:
    """
    Route a post to the appropriate TikTok publishing function.

    Args:
        brand_id:    Internal brand ID.
        platforms:   List containing 'tiktok'.
        post_id:     Internal Supabase post ID.
        mode:        'publish' | 'draft' | 'scheduled'
        scheduled_at: ISO timestamp (required when mode='scheduled').
        post_type:   'slideshow' (photo carousel) or 'video'.
    """
    raw_post = get_post(post_id)
    if not raw_post:
        api_error(404, "POST_NOT_FOUND", f"Post {post_id} not found")

    if raw_post.get("brand_id") != brand_id:
        api_error(403, "FORBIDDEN", "brand_id does not match post")

    # Draft / scheduled: just update DB status, no TikTok API call yet
    if mode in ("draft", "scheduled"):
        updates: dict = {"status": mode}
        if mode == "scheduled" and scheduled_at:
            updates["scheduled_time"] = scheduled_at
        update_post(post_id, updates)
        return SuccessResponse(data={"status": mode})

    # Collect TikTok integrations for this brand
    social_integrations = get_social_accounts(brand_id, ["tiktok"])
    if not social_integrations:
        api_error(400, "NO_TIKTOK_ACCOUNTS", f"No TikTok accounts connected to brand {brand_id}")

    # Publish to all connected TikTok accounts
    results = []
    for integration in social_integrations:
        integration_id = (
            integration.get("id") if isinstance(integration, dict) else integration.id
        )
        
        

        try:
            token = await get_valid_token(integration_id)
        except TokenError as exc:
            print(f"[TikTok] Skipping integration {integration_id}: {exc}")
            continue

        client = TikTokClient(token, refresh_fn=make_refresh_fn(integration_id))

        if post_type == "video":
            from .publish.video import publish_video

            result = await publish_video(client=client, raw_post=raw_post, post_id=post_id)
        else:
            from .publish.slideshow import publish_slideshow

            # Build kwargs with disclosure options if provided
            slideshow_kwargs = {
                "client": client,
                "raw_post": raw_post,
                "post_id": post_id,
            }
            
            if tiktok_disclosure_options:
                slideshow_kwargs.update({
                    "privacy_level": tiktok_disclosure_options.get("privacy_level", "PUBLIC"),
                    "disable_duet": tiktok_disclosure_options.get("disable_duet", False),
                    "disable_stitch": tiktok_disclosure_options.get("disable_stitch", False),
                    "disable_comment": tiktok_disclosure_options.get("disable_comment", False),
                    "brand_content_toggle": tiktok_disclosure_options.get("brand_content_toggle", False),
                    "brand_organic_toggle": tiktok_disclosure_options.get("brand_organic_toggle", False),
                    "is_ai_generated": tiktok_disclosure_options.get("is_ai_generated", False),
                })

            result = await publish_slideshow(**slideshow_kwargs)

        results.append(result)

    return SuccessResponse(data={"status": "posting", "results": results})


async def draft_post(brand_id: str, platforms: List[str], post_id: str) -> SuccessResponse:
    return await make_post(brand_id, platforms, post_id, mode="draft")


async def publish_post(brand_id: str, platforms: List[str], post_id: str, tiktok_disclosure_options: dict = None) -> SuccessResponse:
    return await make_post(brand_id, platforms, post_id, mode="publish", tiktok_disclosure_options=tiktok_disclosure_options)


async def schedule_post(
    brand_id: str,
    platforms: List[str],
    post_id: str,
    scheduled_at: str,
) -> SuccessResponse:
    return await make_post(
        brand_id, platforms, post_id, mode="scheduled", scheduled_at=scheduled_at
    )