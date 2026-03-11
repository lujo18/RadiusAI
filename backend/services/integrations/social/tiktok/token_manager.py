"""
TikTok token manager.

Reads TikTok OAuth tokens from the platform_integrations Supabase table,
proactively refreshes the access token when it's within TOKEN_REFRESH_BUFFER_SECONDS
of expiry, persists the new tokens, and returns a fresh access_token.

Usage:
    token = await get_valid_token(integration_id)
    client = TikTokClient(token, refresh_fn=lambda: get_valid_token(integration_id))
"""

from datetime import datetime, timezone, timedelta
from typing import Optional

from config import Config
from services.integrations.supabase.client import get_supabase
from .client import TikTokClient, TikTokAPIError

# Refresh the access_token this many seconds before it actually expires to avoid
# race conditions between check-time and API call time.
TOKEN_REFRESH_BUFFER_SECONDS = 300  # 5 minutes


class TokenError(Exception):
    """Raised when a valid token cannot be obtained."""


async def get_valid_token(integration_id: str, force_refresh: bool = False) -> str:
    """
    Return a valid TikTok access_token for the given platform_integration row.

    Steps:
    1. Fetch the row from platform_integrations.
    2. If token is still valid (> 5 min remaining) AND force_refresh is False → return immediately.
    3. Otherwise call TikTok /v2/oauth/token/ with grant_type=refresh_token.
    4. Persist the new tokens and expiry back to Supabase.
    5. Return the fresh access_token.

    Args:
        force_refresh: If True, skip the expiry check and always call the refresh endpoint.
                       Use this when TikTok has already rejected the current token with a 401.

    Raises:
        TokenError: If the integration is not found, disconnected, or refresh fails.
    """
    supabase = get_supabase()

    res = (
        supabase.table("platform_integrations")
        .select("*")
        .eq("id", integration_id)
        .single()
        .execute()
    )

    row = res.data
    if not row:
        raise TokenError(f"No platform_integration found for id={integration_id}")

    if row.get("status") == "disconnected":
        raise TokenError(f"Integration {integration_id} is disconnected")

    access_token: Optional[str] = row.get("tiktok_access_token")
    refresh_token: Optional[str] = row.get("tiktok_refresh_token")
    expires_at_str: Optional[str] = row.get("tiktok_token_expires_at")

    if not access_token or not refresh_token:
        raise TokenError(
            f"Integration {integration_id} has no TikTok tokens stored. "
            "The account needs to be reconnected."
        )

    # Check if current access token is still fresh enough (skip when force_refresh=True)
    if not force_refresh and expires_at_str:
        try:
            expires_at = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
            cutoff = datetime.now(timezone.utc) + timedelta(
                seconds=TOKEN_REFRESH_BUFFER_SECONDS
            )
            if expires_at > cutoff:
                return access_token  # Still valid
        except ValueError:
            pass  # Malformed timestamp – fall through to refresh

    # Refresh
    client_key = Config.TIKTOK_CLIENT_KEY
    client_secret = Config.TIKTOK_CLIENT_SECRET

    if not client_key or not client_secret:
        raise TokenError("TIKTOK_CLIENT_KEY or TIKTOK_CLIENT_SECRET not configured")

    try:
        token_data = await TikTokClient.refresh_token(
            client_key=client_key,
            client_secret=client_secret,
            refresh_token=refresh_token,
        )
    except TikTokAPIError as exc:
        raise TokenError(f"TikTok token refresh failed: {exc}") from exc

    new_access_token: str = token_data["access_token"]
    new_refresh_token: str = token_data.get("refresh_token", refresh_token)
    expires_in: int = token_data.get("expires_in", 86400)  # default 1 day
    refresh_expires_in: int = token_data.get("refresh_expires_in", 2592000)  # 30 days

    now = datetime.now(timezone.utc)
    new_expires_at = (now + timedelta(seconds=expires_in)).isoformat()
    new_refresh_expires_at = (
        now + timedelta(seconds=refresh_expires_in)
    ).isoformat()

    supabase.table("platform_integrations").update(
        {
            "tiktok_access_token": new_access_token,
            "tiktok_refresh_token": new_refresh_token,
            "tiktok_token_expires_at": new_expires_at,
            "tiktok_refresh_expires_at": new_refresh_expires_at,
            "updated_at": now.isoformat(),
        }
    ).eq("id", integration_id).execute()

    return new_access_token


def make_refresh_fn(integration_id: str):
    """
    Returns a zero-argument async callable suitable for TikTokClient(refresh_fn=...).
    Always forces a token refresh since it's only called after a 401.

    Example:
        client = TikTokClient(token, refresh_fn=make_refresh_fn(integration_id))
    """

    async def _refresh() -> str:
        return await get_valid_token(integration_id, force_refresh=True)

    return _refresh
