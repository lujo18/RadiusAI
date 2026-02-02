# PostForMe Analytics Client
# Handles API calls to PostForMe for fetching post metrics

import httpx
from typing import Optional
from datetime import datetime
from backend.config import Config
from backend.models.postforme_analytics import PostForMeAnalyticsResponse

POST_FOR_ME_API_KEY = Config.POST_FOR_ME_API_KEY
POST_FOR_ME_BASE_URL = "https://api.postforme.dev/v1"


class PostForMeAnalyticsClient:
    """Client for PostForMe analytics API"""

    def __init__(self, api_key: str = POST_FOR_ME_API_KEY):
        self.api_key = api_key
        self.base_url = POST_FOR_ME_BASE_URL

    async def get_post_analytics(
        self,
        social_post_id: str,
        limit: int = 1,
        expand: Optional[list[str]] = None
    ) -> Optional[PostForMeAnalyticsResponse]:
        """
        Fetch analytics for a specific social post from PostForMe.
        
        Args:
            social_post_id: The PostForMe social_post_id to query
            limit: Number of items to return (default: 1)
            expand: List of fields to expand (default: ["metrics"])
        
        Returns:
            PostForMeAnalyticsResponse with metrics, or None if error
        """
        if expand is None:
            expand = ["metrics"]

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

        params = {
            "social_post_id": social_post_id,
            "limit": limit,
            "expand": expand,  # Will be properly formatted by httpx
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/items",
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
