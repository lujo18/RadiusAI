"""
TikTokProvider – implements the SocialProvider Protocol.

Drop-in replacement for PostForMeProvider. Wire it up by changing
get_social_provider() in services/integrations/social/provider.py,
or by importing TikTokProvider directly.
"""

from typing import List

from backend.features.error.response import SuccessResponse
from services.integrations.social.social_provider import (
    CreateAuthUrlResponse,
    SaveIntegrationResponse,
    SocialProvider,
)
from .social_account import (
    create_auth_url,
    disconnect_integration,
    draft_post,
    make_post,
    publish_post,
    save_integration,
    schedule_post,
)


class TikTokProvider(SocialProvider):
    """
    Implements SocialProvider using TikTok's direct Content Posting API.

    All publishing flows (publish / draft / schedule) route through
    make_post(), which further delegates to publish/slideshow.py or
    publish/video.py based on the `post_type` arg.

    Analytics are handled by tiktok/analytics/client.py and are consumed
    separately by the analytics background worker (not through this interface).
    """

    async def create_auth_url(
        self,
        platform: str,
        user_id: str,
        brand_id: str,
        existing_profile_id: str = "",
    ) -> CreateAuthUrlResponse:
       
        return await create_auth_url(
            platform=platform,
            user_id=user_id,
            brand_id=brand_id,
            existing_profile_id=existing_profile_id,
        )

    async def save_integration(self, response: dict) -> SaveIntegrationResponse:
        return await save_integration(response)

    async def disconnect_integration(self, integration_id: str) -> SuccessResponse:
        return await disconnect_integration(integration_id)

    async def publish_post(
        self, brand_id: str, platforms: List[str], post_id: str, tiktok_disclosure_options: dict = None
    ) -> SuccessResponse:
        return await publish_post(brand_id, platforms, post_id, tiktok_disclosure_options=tiktok_disclosure_options)

    async def draft_post(
        self, brand_id: str, platforms: List[str], post_id: str
    ) -> SuccessResponse:
        return await draft_post(brand_id, platforms, post_id)

    async def schedule_post(
        self,
        brand_id: str,
        platforms: List[str],
        post_id: str,
        scheduled_at: str,
    ) -> SuccessResponse:
        return await schedule_post(brand_id, platforms, post_id, scheduled_at)

    def get_profile(self, account_id: str) -> dict:
        # Profile data is fetched during save_integration and stored in Supabase.
        # For a live re-fetch, use TikTokClient directly with the stored token.
        raise NotImplementedError(
            "Use tiktok/analytics/client.py or re-run save_integration to refresh profile data."
        )


    async def get_post_metrics(self, post_id: str):
        raise NotImplementedError(
            "Analytics are handled separately by tiktok/analytics/client.py"
        )