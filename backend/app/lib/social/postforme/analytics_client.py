# PostForMe Analytics Client
# Handles API calls to PostForMe for fetching post metrics

import logging
import httpx
from typing import Optional
from datetime import datetime
from app.features.integrations.supabase.db.platformIntegration import getIntegrationById
from app.core.config import settings
from app.features.analytics.schemas import PostForMeAnalyticsResponse

POST_FOR_ME_API_KEY = settings.POST_FOR_ME_API_KEY

logger = logging.Logger(__name__)


class PostForMeAnalyticsClient:
    """Client for PostForMe analytics API"""

    async def get_post_analytics(
        self,
        social_post_id: str,
        platform_id: str,
        limit: int = 50,
        expand: Optional[list[str]] = None,
    ) -> Optional[PostForMeAnalyticsResponse]:
        """
        Fetch analytics for a specific social post from PostForMe.

        ⚠️ NOTE: PostForMe API doesn't support filtering by post_id in params.
        We must fetch all posts (paginated) and filter locally for the matching platform_post_id.

        Args:
            social_post_id: The platform post ID to match (e.g., TikTok video ID "7609906972204322061")
            platform_id: The social account integration ID
            limit: Number of posts to fetch per request (default: 50)
            expand: List of fields to expand (default: ["metrics"])

        Returns:
            PostForMeAnalyticsResponse with metrics for the matched post, or None if not found
        """

        if expand is None:
            expand = ["metrics"]

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {POST_FOR_ME_API_KEY}",
        }

        params = {
            "external_post_id": [social_post_id],
            "limit": 50,
            "expand": expand,
        }

        social_integration = getIntegrationById(platform_id)

        if social_integration is None:
            raise ValueError("No social integration found for id", platform_id)

        social_account_id = social_integration.pfm_account_id

        print(
            "Getting analytics for post",
            social_post_id,
            " from account id",
            social_account_id,
        )

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"https://api.postforme.dev/v1/social-account-feeds/{social_account_id}",
                    headers=headers,
                    params=params,
                )
                response.raise_for_status()

                data = response.json()
                return PostForMeAnalyticsResponse(**data)

        except httpx.HTTPError as e:
            print(f"PostForMe API error: {e}")
            return None
        except Exception as e:
            print(f"Error fetching PostForMe analytics: {e}")
            return None

    # ========== DEPRECATED: Original implementation (kept for reference) ==========
    async def get_post_analytics_OLD_DEPRECATED(
        self,
        social_post_id: str,
        platform_id: str,
        limit: int = 1,
        expand: Optional[list[str]] = None,
    ) -> Optional[PostForMeAnalyticsResponse]:
        """
        ⚠️ DEPRECATED: This function attempted to filter by external_post_id in request params,
        but PostForMe API doesn't support this. Use get_post_analytics() instead.

        Kept for reference only.
        """
        if expand is None:
            expand = ["metrics"]

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {POST_FOR_ME_API_KEY}",
        }

        params = {
            "external_post_id": [social_post_id],
            "limit": 50,
            "expand": expand,
        }

        social_integration = getIntegrationById(platform_id)

        if social_integration is None:
            raise ValueError("No social integration found for id", platform_id)

        social_account_id = social_integration.pfm_account_id

        print(
            "Getting analytics for post",
            social_post_id,
            " from account id",
            social_account_id,
        )

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"https://api.postforme.dev/v1/social-account-feeds/{social_account_id}",
                    headers=headers,
                    params=params,
                )
                response.raise_for_status()

                data = response.json()
                return PostForMeAnalyticsResponse(**data)

        except httpx.HTTPError as e:
            print(f"PostForMe API error: {e}")
            return None
        except Exception as e:
            print(f"Error fetching PostForMe analytics: {e}")
            return None


# Singleton instance
_client = None


def get_postforme_analytics_client() -> PostForMeAnalyticsClient:
    """Get or create the PostForMe analytics client"""
    global _client
    if _client is None:
        _client = PostForMeAnalyticsClient()
    return _client
