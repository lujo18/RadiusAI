# backend/services/integrations/provider.py
from backend.config import Config
from backend.services.integrations.social.social_provider import CreateAuthUrlResponse, SocialProvider
from backend.util import generate_state
from .social_account import create_auth_url
from fastapi.responses import RedirectResponse


class LateProvider(SocialProvider):
    async def create_auth_url(self, platform: str, user_id: str, brand_id: str, existing_profile_id: str = "") -> CreateAuthUrlResponse: 
      state = generate_state(brand_id, user_id)
      redirect_url = f"{Config.BACKEND_URL}/social/callback/{state}"
      
      return await create_auth_url(platform, redirect_url, late_profile_id=existing_profile_id)
    def exchange_code(self, code: str, platform: str) -> dict: ...
    def create_post(self, platform: str, content: dict, account_id: str) -> dict: ...
    def get_profile(self, account_id: str) -> dict: ...
    # Add more methods as needed