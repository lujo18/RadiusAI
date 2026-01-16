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

from backend.auth import get_current_user
from backend.services.integrations.social.provider import get_social_provider
from backend.services.integrations.supabase.db.brand import (
    connect_social_account_to_brand,
)
from backend.util import decode_state, generate_state
from ..config import Config, get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/social", tags=["Social Connections"])

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
    
class GetConnectResponse(BaseModel):
    connected: str
    profileId: str
    username: str
    
provider = get_social_provider()


def validate_platform(platform: str) -> str:
    """Validate and normalize platform name"""
    platform_lower = platform.lower()
    if platform_lower not in PLATFORM_ENDPOINTS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported platform: {platform}. Supported: {list(PLATFORM_ENDPOINTS.keys())}",
        )
    return platform_lower

@router.get("/connect/{platform}")
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
    
    url = provider.create_auth_url(platform, user_id, request.brand_id, str(request.existing_profile_id))
    return url

    


# Callback endpoint removed - Late API handles redirect directly with redirect_url parameter
@router.get("/callback/{vs_state}")
async def get_social_connection(vs_state: str, request: Request):
    
    # FIXME: Integration guidance
    # code = request.query_params.get("code") 
    # platform = request.query_params.get("platform") 
    
    # account = exchange_code(code, platform) 
    # save_to_db(account) 
    
    # return {"connected": platform, "account": account
    
    
    logger.info("Successfully recieved Late social connection", request)
    
    payload = decode_state(vs_state)
    
    brand_id = payload["brandId"]
    user_id = payload["userId"]
    connected = request.query_params.get("connected")
    profile_id = request.query_params.get("profileId")
    username = request.query_params.get("username")
    
    # Check required params and ensure they are all str (not None)
    if not all([brand_id, user_id, profile_id, username, connected]):
        raise HTTPException(status_code=400, detail="Missing required query parameters.")

    # Defensive: cast to str to satisfy type checker (since above check ensures not None)
    connect_social_account_to_brand(
        user_id=str(user_id),
        brand_id=str(brand_id),
        platform=str(connected),
        late_account_id=str(profile_id),
        username=str(username)
    )
    
    return RedirectResponse(url=f"{Config.FRONTEND_URL}/brand/{brand_id}/settings/?platform={connected}")
    

@router.get("/test-connection")
async def test_late_api_connection():
    """
    Test connectivity to Late API
    Useful for debugging network/API key issues
    """
    if not Config.LATE_API_KEY:
        return {
            "success": False,
            "message": "LATE_API_KEY not configured in environment variables",
        }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Test basic connectivity to Late API
            response = await client.get(
                "https://getlate.dev/api/v1",
                headers={"Authorization": f"Bearer {Config.LATE_API_KEY}"},
            )

            return {
                "success": True,
                "message": "Successfully connected to Late API",
                "status_code": response.status_code,
                "api_reachable": True,
            }

    except httpx.RequestError as e:
        return {
            "success": False,
            "message": f"Cannot reach Late API",
            "error": str(e),
            "api_reachable": False,
            "suggestions": [
                "Check your internet connection",
                "Verify Late API is operational at status.getlate.dev",
                "Check firewall/proxy settings",
                "Verify LATE_API_KEY is correct",
            ],
        }
    except Exception as e:
        return {"success": False, "message": f"Unexpected error: {str(e)}"}
