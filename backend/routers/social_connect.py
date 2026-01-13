"""
Social Media Connection Router - Generalized OAuth Flow with Late API
Supports: TikTok, Instagram, LinkedIn, Twitter, etc.
"""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse
from typing import Optional, Dict
from pydantic import BaseModel
import httpx
import os
from datetime import datetime, timedelta

from config import Config, get_settings

router = APIRouter(prefix="/connect-social", tags=["Social Connections"])

settings = get_settings()
LATE_API_KEY = Config.LATE_API_KEY

# Frontend URL for redirects after OAuth (configure in production)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Temporary storage for connectTokens (use Redis in production)
# Format: {connectToken: {platform: str, userId: str, createdAt: datetime}}
connect_token_cache: Dict[str, dict] = {}

# Platform mapping for Late API endpoints
PLATFORM_ENDPOINTS = {
    "tiktok": "tiktok",
    "instagram": "instagram",
    "linkedin": "linkedin",
    "twitter": "twitter",
    "facebook": "facebook"
}


# Request models
class StartConnectRequest(BaseModel):
    platform: str
    user_id: Optional[str] = None


def validate_platform(platform: str) -> str:
    """Validate and normalize platform name"""
    platform_lower = platform.lower()
    if platform_lower not in PLATFORM_ENDPOINTS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported platform: {platform}. Supported: {list(PLATFORM_ENDPOINTS.keys())}"
        )
    return platform_lower


def cleanup_expired_tokens():
    """Remove tokens older than 10 minutes"""
    cutoff = datetime.now() - timedelta(minutes=10)
    expired = [
        token for token, data in connect_token_cache.items()
        if data["createdAt"] < cutoff
    ]
    for token in expired:
        del connect_token_cache[token]


@router.post("/start")
async def start_social_connect(request: StartConnectRequest):
    """
    Start OAuth flow for a social media platform
    
    Args:
        request: StartConnectRequest containing platform and optional user_id
    
    Returns:
        authUrl: URL to redirect user to for OAuth consent
        connectToken: Token to complete the connection (internal use)
    """
    if not LATE_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="LATE_API_KEY not configured"
        )
    
    platform = validate_platform(request.platform)
    cleanup_expired_tokens()
    
    late_endpoint = PLATFORM_ENDPOINTS[platform]
    
    # Build redirect URL back to frontend with success parameters
    redirect_url = f"{FRONTEND_URL}/brand/profiles?success=true&platform={platform}"
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Late API uses GET with profileId and redirect_url query parameters
            params = {"redirect_url": redirect_url}
            if request.user_id:
                params["profileId"] = request.user_id
            
            response = await client.get(
                f"https://getlate.dev/api/v1/connect/{late_endpoint}",
                headers={"Authorization": f"Bearer {LATE_API_KEY}"},
                params=params
            )
            response.raise_for_status()
            data = response.json()
        
        # No need to cache tokens - Late handles the redirect directly
        return {
            "authUrl": data.get("authUrl"),
            "platform": platform,
            "message": f"Redirect user to authUrl to authorize {platform.title()} access"
        }
    
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Late API error: {e.response.text}"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Cannot reach Late API. Please check: 1) LATE_API_KEY is correct, 2) Internet connection is active, 3) Late API status at status.getlate.dev. Error: {str(e)}"
        )


# Callback endpoint removed - Late API handles redirect directly with redirect_url parameter


@router.get("/status/{connect_token}")
async def check_connection_status(connect_token: str):
    """
    Check if a connectToken is still valid
    Useful for debugging or showing connection progress
    """
    cleanup_expired_tokens()
    
    if connect_token not in connect_token_cache:
        return {
            "valid": False,
            "message": "Token not found or expired"
        }
    
    data = connect_token_cache[connect_token]
    return {
        "valid": True,
        "platform": data["platform"],
        "createdAt": data["createdAt"].isoformat(),
        "expiresAt": (data["createdAt"] + timedelta(minutes=10)).isoformat()
    }


@router.delete("/cancel/{connect_token}")
async def cancel_connection(connect_token: str):
    """
    Cancel an in-progress connection
    Removes the connectToken from cache
    """
    if connect_token in connect_token_cache:
        del connect_token_cache[connect_token]
        return {"success": True, "message": "Connection cancelled"}
    
    return {"success": False, "message": "Token not found"}


@router.get("/test-connection")
async def test_late_api_connection():
    """
    Test connectivity to Late API
    Useful for debugging network/API key issues
    """
    if not LATE_API_KEY:
        return {
            "success": False,
            "message": "LATE_API_KEY not configured in environment variables"
        }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Test basic connectivity to Late API
            response = await client.get(
                "https://getlate.dev/api/v1",
                headers={"Authorization": f"Bearer {LATE_API_KEY}"}
            )
            
            return {
                "success": True,
                "message": "Successfully connected to Late API",
                "status_code": response.status_code,
                "api_reachable": True
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
                "Verify LATE_API_KEY is correct"
            ]
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Unexpected error: {str(e)}"
        }
