# backend/services/integrations/provider_example.py

from typing import List, Protocol, Any

from pydantic import BaseModel

from models.post import Post

class CreateAuthUrlResponse(BaseModel):
    """
    Response model for social provider authentication URL generation.
    Used to standardize the output of create_auth_url across all providers.
    """
    authUrl: str  # The URL to redirect the user for OAuth consent
    platform: str  # The social platform (e.g., 'instagram', 'tiktok')
    message: str   # Human-readable message for logging or UI
    
    
class SaveIntegrationResponse(BaseModel):
    brand_id: str
    platform_connected: str

class SocialProvider(Protocol):
    """
    Base protocol for all social API providers (PostForMe, Late, custom, etc).
    Defines the required interface for provider classes so they can be swapped easily.

    All provider implementations must match these method signatures and return types.
    This enables provider-agnostic routing and easy migration between APIs.
    """
    async def create_auth_url(
        self,
        platform: str,
        user_id: str,
        brand_id: str,
        existing_profile_id: str = ""
    ) -> CreateAuthUrlResponse:
        """
        Generate an OAuth URL for a given platform and user/brand context.
        Args:
            platform: Social platform name (e.g., 'instagram').
            user_id: Internal user ID. for redirect
            brand_id: Internal brand ID. for redirect
            existing_profile_id: Provider-specific profile/account ID (if reconnecting).
        Returns:
            CreateAuthUrlResponse: Standardized response with auth URL and metadata.
        """
        ...

    async def save_integration(self, response: dict) -> SaveIntegrationResponse:
        """
        Exchange an OAuth code for a connected account.
        Args:
            code: OAuth code or token from the platform.
            platform: Social platform name.
        Returns:
            dict: Provider-specific account details.
        """
        ...
        
    async def disconnect_integration(self, integration_id: str) -> bool:
        ...

    async def publish_post(self, brand_id: str, platforms: List[str], post_id: str) -> dict:
        """
        Create a post on the given platform/account.
        Args:
            brand_id: Internal brand ID.
            platforms: List of platform names to post to.
            post_id: Internal post ID.
        Returns:
            dict: Provider-specific post creation response.
        """
        ...

    async def draft_post(self, brand_id: str, platforms: List[str], post_id: str) -> dict:
        """
        Save a post as draft.
        Args:
            brand_id: Internal brand ID.
            platforms: List of platform names to save draft for.
            post_id: Internal post ID.
        Returns:
            dict: Provider-specific draft creation response.
        """
        ...

    async def schedule_post(self, brand_id: str, platforms: List[str], post_id: str, scheduled_at: str) -> dict:
        """
        Schedule a post for future publishing.
        Args:
            brand_id: Internal brand ID.
            platforms: List of platform names to schedule for.
            post_id: Internal post ID.
            scheduled_at: ISO timestamp for when to publish.
        Returns:
            dict: Provider-specific scheduling response.
        """
        ...

    def get_profile(self, account_id: str) -> dict:
        """
        Fetch profile/account details from the provider.
        Args:
            account_id: Provider-specific account ID.
        Returns:
            dict: Provider-specific profile data.
        """
        ...
    # Add more methods as needed, documenting each for clarity