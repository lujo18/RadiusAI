# backend/services/integrations/provider_example.py

from typing import Protocol, Any

from pydantic import BaseModel

class CreateAuthUrlResponse(BaseModel):
    """
    Response model for social provider authentication URL generation.
    Used to standardize the output of create_auth_url across all providers.
    """
    authUrl: str  # The URL to redirect the user for OAuth consent
    platform: str  # The social platform (e.g., 'instagram', 'tiktok')
    message: str   # Human-readable message for logging or UI
    
    

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

    def exchange_code(self, code: str, platform: str) -> dict:
        """
        Exchange an OAuth code for a connected account.
        Args:
            code: OAuth code or token from the platform.
            platform: Social platform name.
        Returns:
            dict: Provider-specific account details.
        """
        ...

    def create_post(self, platform: str, content: dict, account_id: str) -> dict:
        """
        Create a post on the given platform/account.
        Args:
            platform: Social platform name.
            content: Post content payload (text, images, etc).
            account_id: Provider-specific account ID.
        Returns:
            dict: Provider-specific post creation response.
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