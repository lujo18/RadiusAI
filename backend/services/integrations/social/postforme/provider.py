# backend/services/integrations/postforme/provider.py

from typing import List
from backend.features.error.response import SuccessResponse
from backend.services.analytics_service import get_post_analytics
from models.post import Post
from services.integrations.social.social_provider import CreateAuthUrlResponse, SaveIntegrationResponse, SocialProvider
from .social_account import (
    create_auth_url, 
    disconnect_integration, 
    make_post, 
    save_integration,
    publish_post,
    draft_post,
    schedule_post
)
# from .post_generation import create_post, get_profile

class PostForMeProvider(SocialProvider):
    async def create_auth_url(self, platform: str, user_id: str, brand_id: str, existing_profile_id: str = "") -> CreateAuthUrlResponse:
        return await create_auth_url(platform, external_id=brand_id)
    
    async def save_integration(self, response: dict) -> SaveIntegrationResponse:
        return await save_integration(response)
        
    async def disconnect_integration(self, integration_id: str) -> SuccessResponse:
        return await disconnect_integration(integration_id)    
    
    async def publish_post(self, brand_id: str, platforms: List[str], post_id: str) -> dict:
        return await publish_post(brand_id, platforms, post_id)
    
    async def draft_post(self, brand_id: str, platforms: List[str], post_id: str) -> dict:
        return await draft_post(brand_id, platforms, post_id)
    
    async def schedule_post(self, brand_id: str, platforms: List[str], post_id: str, scheduled_at: str) -> dict:
        return await schedule_post(brand_id, platforms, post_id, scheduled_at)
    
    def get_profile(self, account_id: str) -> dict: ...
        
        
    async def get_post_metrics(self, post_id: str):
        return await get_post_analytics(post_id)