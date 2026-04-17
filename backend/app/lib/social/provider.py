# backend/services/social_provider_factory.py

import os

from backend.app.core.config import settings

from .late.provider import LateProvider
from .postforme.provider import PostForMeProvider
from .social_provider import SocialProvider

# from ..custom.social_account import CustomProvider


def get_social_provider() -> SocialProvider:
    # Use env/config to select provider
    provider_name = settings.SOCIAL_PROVIDER
    if provider_name == "postforme":
        return PostForMeProvider()
    if provider_name == "late":
        return LateProvider()
    # elif provider_name == "custom":
    #     return CustomProvider()
    raise ValueError("Unknown social provider")
