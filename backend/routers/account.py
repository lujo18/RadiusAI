"""
Social Media Connection Router - Generalized OAuth Flow with Late API
Supports: TikTok, Instagram, LinkedIn, Twitter, etc.
"""

import json
import logging
import time
from urllib.parse import quote, urlencode
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from typing import Optional, Dict
import jwt
from pydantic import BaseModel
import httpx
import os
from datetime import datetime, timedelta

from auth import get_current_user
from backend.features.error.helper import api_error
from backend.features.error.response import SuccessResponse
from backend.services.integrations.supabase.client import get_supabase
from services.integrations.social.provider import get_social_provider
from services.integrations.supabase.db.brand import (
    connect_social_account_to_brand,
)
from util import decode_state, generate_state
from config import Config, get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/social", tags=["Social Connections"])

settings = get_settings()

# Temporary storage for connectTokens (use Redis in production)
# Format: {connectToken: {platform: str, userId: str, createdAt: datetime}}
connect_token_cache: Dict[str, dict] = {}

# Platform mapping for Late API endpoints
PLATFORM_ENDPOINTS = {
    "tiktok": "tiktok",
    "instagram": "instagram",
    "linkedin": "linkedin",
    "twitter": "twitter",
    "facebook": "facebook",
}


# Request models
class StartConnectRequest(BaseModel):
    existing_profile_id: Optional[str] = None # was late_profile_id (attached to brand to handle late connection)
    brand_id: str
    
class DisconnectSocialRequest(BaseModel):
    integration_id: str
class GetConnectResponse(BaseModel):
    connected: str
    profileId: str
    username: str
    
provider = get_social_provider()


def validate_platform(platform: str) -> str:
    """Validate and normalize platform name"""
    platform_lower = platform.lower()
    if platform_lower not in PLATFORM_ENDPOINTS:
        api_error(
            400,
            "INVALID_PLATFORM",
            f"Unsupported platform: {platform}. Supported: {list(PLATFORM_ENDPOINTS.keys())}",
        )
    return platform_lower

@router.post("/connect/{platform}")
async def start_social_connect(
    request: StartConnectRequest, 
    platform: str,
    user_id: str = Depends(get_current_user)
):
    """
    Start OAuth flow for a social media platform

    Args:
        request: StartConnectRequest containing platform and optional user_id

    Returns:
        authUrl: URL to redirect user to for OAuth consent
        connectToken: Token to complete the connection (internal use)
    """
    
    # FIXME: Implementation guidance
    # url = create_auth_url(platform) 
    # return {"url": url}
    
    platform = validate_platform(platform)
    
    url = await provider.create_auth_url(platform, user_id, request.brand_id, str(request.existing_profile_id))
    
    return SuccessResponse(data=url)

    

@router.get("/callback")
async def get_social_connection(request: Request):
    
    # FIXME: Integration guidance
    # code = request.query_params.get("code") 
    # platform = request.query_params.get("platform") 
    
    # account = exchange_code(code, platform) 
    # save_to_db(account) 
    
    # return {"connected": platform, "account": account
    
    # TODO! Pass brand_id as external id forme
    # TODO! Then query postforme in callback using account_ids
    # 1. external_id 2. provider
    # 
    # Take this profile + brandId and make supabase connection
    # Then return to normal url
    response = dict(request.query_params)
    
    data = await provider.save_integration(response)
    
    brand_id = data.brand_id
    
    supabase = get_supabase()

    
    brand = supabase.table("brand").select("*").eq("id", brand_id).execute()
    brand = brand.data[0]
    team = supabase.table("teams").select("*").eq("id", brand.get("team_id")).execute()
    team = team.data[0]
    
    platform_connected = data.platform_connected
    
    # Check required params and ensure they are all str (not None)
    if not all([brand_id, platform_connected]):
        api_error(400, "MISSING_PARAMS", "Missing required query parameters.")
    
    return RedirectResponse(url=f"{Config.FRONTEND_URL}/{team.get("id")}/brand/{brand_id}/settings/?platform={platform_connected}")
  

@router.post("/disconnect")
async def disconnect_social(request: DisconnectSocialRequest):
    integration_id = request.integration_id
    return await provider.disconnect_integration(integration_id)