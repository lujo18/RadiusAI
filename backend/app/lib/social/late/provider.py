from typing import List

from app.core.config import settings

from ..social_provider import (
    CreateAuthUrlResponse,
    SaveIntegrationResponse,
    SocialProvider,
)
from app.shared.security import generate_state
from .social_account import create_auth_url


class LateProvider(SocialProvider):
    async def create_auth_url(
        self, platform: str, user_id: str, brand_id: str, existing_profile_id: str = ""
    ) -> CreateAuthUrlResponse:
        state = generate_state(brand_id, user_id)
        redirect_url = f"{settings.BACKEND_URL}/social/callback/{state}"

        return await create_auth_url(
            platform, redirect_url, late_profile_id=existing_profile_id
        )

    async def save_integration(self, response: dict) -> SaveIntegrationResponse:
        # TODO: Implement Late-specific integration saving
        raise NotImplementedError("Late save_integration not implemented")

    async def disconnect_integration(self, integration_id: str) -> bool:
        # TODO: Implement Late-specific disconnection
        raise NotImplementedError("Late disconnect_integration not implemented")

    async def publish_post(
        self, brand_id: str, platforms: List[str], post_id: str
    ) -> dict:
        # TODO: Implement Late-specific publishing
        raise NotImplementedError("Late publish_post not implemented")

    async def draft_post(
        self, brand_id: str, platforms: List[str], post_id: str
    ) -> dict:
        # TODO: Implement Late-specific draft saving
        raise NotImplementedError("Late draft_post not implemented")

    async def schedule_post(
        self, brand_id: str, platforms: List[str], post_id: str, scheduled_at: str
    ) -> dict:
        # TODO: Implement Late-specific scheduling
        raise NotImplementedError("Late schedule_post not implemented")

    def get_profile(self, account_id: str) -> dict:
        # TODO: Implement Late-specific profile fetching
        raise NotImplementedError("Late get_profile not implemented")

    # Add more methods as needed
