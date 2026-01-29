# backend/services/integrations/postforme/provider.py

from typing import List
from backend.models.post import Post
from backend.services.integrations.social.social_provider import CreateAuthUrlResponse, SaveIntegrationResponse, SocialProvider
from .social_account import create_auth_url, disconnect_integration, save_integration
# from .post_generation import create_post, get_profile

class PostForMeProvider(SocialProvider):
    async def create_auth_url(self, platform: str, user_id: str, brand_id: str, existing_profile_id: str = "") -> CreateAuthUrlResponse:
        return await create_auth_url(platform, external_id=brand_id)
    
    async def save_integration(self, response: dict) -> SaveIntegrationResponse:
        return await save_integration(response)
        
    async def disconnect_integration(self, integration_id: str) -> bool:
        return await disconnect_integration(integration_id)    
    
    def create_post(self, brand_id: str, platforms: List[str], post: Post) -> dict: ...
    def get_profile(self, account_id: str) -> dict: ...
        