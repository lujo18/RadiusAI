# backend/services/social_provider_factory.py

import os

from .late.provider import LateProvider
from .postforme.provider import PostForMeProvider
from .tiktok.provider import TikTokProvider
# from ..custom.social_account import CustomProvider

def get_social_provider():
    # Use env/config to select provider
    provider_name = os.getenv("SOCIAL_PROVIDER", "postforme")
    if provider_name == "postforme":
        return PostForMeProvider()
    if provider_name == "late":
      return LateProvider()
    if provider_name == "native":
        return TikTokProvider()
    raise ValueError("Unknown social provider")