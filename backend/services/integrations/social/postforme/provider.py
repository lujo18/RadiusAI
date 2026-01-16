# backend/services/integrations/postforme/provider.py

from backend.services.integrations.social.social_provider import CreateAuthUrlResponse, SocialProvider
from .social_account import create_auth_url, exchange_code
# from .post_generation import create_post, get_profile

class PostForMeProvider(SocialProvider):
    async def create_auth_url(self, platform: str, user_id: str, brand_id: str, existing_profile_id: str = "") -> CreateAuthUrlResponse:
        return await create_auth_url(platform, external_id=existing_profile_id)
    # def exchange_code(self, code, platform):
    #     return exchange_code(code, platform)
    # def create_post(self, platform, content, account_id):
    #     # return create_post(platform, content, account_id)
    # def get_profile(self, account_id):
    
    def exchange_code(self, code: str, platform: str) -> dict: ...
    def create_post(self, platform: str, content: dict, account_id: str) -> dict: ...
    def get_profile(self, account_id: str) -> dict: ...
        