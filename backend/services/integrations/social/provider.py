# backend/services/social_provider_factory.py

import os

from .late.provider import LateProvider
from .postforme.provider import PostForMeProvider
# from ..custom.social_account import CustomProvider

def get_social_provider():
    # Use env/config to select provider
    provider_name = os.getenv("SOCIAL_PROVIDER", "postforme")
    if provider_name == "postforme":
        return PostForMeProvider()
    if provider_name == "late":
      return LateProvider()
    # elif provider_name == "custom":
    #     return CustomProvider()
    raise ValueError("Unknown social provider")