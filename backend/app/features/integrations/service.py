"""
Platform Integration Service - OAuth flows and social account management
"""

import logging
import uuid
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, PermissionError as PermError, ValidationError, ExternalServiceError
from app.features.integrations.models import PlatformIntegration, IntegrationStatus
from app.features.integrations.schemas import UpdateIntegrationRequest
from app.features.integrations.repository import IntegrationRepository

logger = logging.getLogger(__name__)

repository = IntegrationRepository()


# ═════════════════════════════════════════════════
#  OAuth Management
# ═════════════════════════════════════════════════

async def generate_oauth_url(
    platform: str,
    brand_id: str,
    state: str
) -> str:
    """
    Generate OAuth authorization URL for user to visit.
    
    Args:
        platform: instagram, tiktok, youtube, etc.
        brand_id: Brand requesting integration
        state: CSRF token for state validation
    
    Returns:
        OAuth authorization URL
    
    Raises:
        ValidationError: If platform not supported
    """
    
    if platform == "instagram":
        # TODO: Use Facebook Graph API OAuth
        return f"https://api.instagram.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=user_profile,user_media&state={state}"
    
    elif platform == "tiktok":
        # TODO: Use TikTok OAuth
        return f"https://www.tiktok.com/v1/oauth/authorize?client_key=YOUR_CLIENT_KEY&response_type=code&scope=user.info.basic&redirect_uri=YOUR_REDIRECT_URI&state={state}"
    
    elif platform == "youtube":
        # TODO: Use Google OAuth
        return f"https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&scope=https://www.googleapis.com/auth/youtube&redirect_uri=YOUR_REDIRECT_URI&state={state}&response_type=code"
    
    else:
        raise ValidationError(f"Platform '{platform}' not yet supported for OAuth")


async def complete_oauth_flow(
    db: AsyncSession,
    user_id: str,
    brand_id: str,
    platform: str,
    auth_code: str
) -> PlatformIntegration:
    """
    Complete OAuth flow and create/update integration.
    
    Args:
        db: Database session
        user_id: User completing OAuth
        brand_id: Brand to link account to
        platform: Social platform (instagram, tiktok, etc.)
        auth_code: Authorization code from OAuth provider
    
    Returns:
        Created or updated PlatformIntegration
    
    Raises:
        ExternalServiceError: If OAuth token exchange fails
        ValidationError: If credentials invalid
    """
    
    # Exchange auth_code for tokens (platform-specific)
    try:
        tokens = await _exchange_auth_code(platform, auth_code)
    except Exception as e:
        logger.error(f"OAuth token exchange failed for {platform}: {e}")
        raise ExternalServiceError(f"Failed to authenticate with {platform}: {str(e)}")
    
    # Fetch user profile from platform
    try:
        profile = await _fetch_platform_profile(platform, tokens["access_token"])
    except Exception as e:
        logger.error(f"Failed to fetch profile from {platform}: {e}")
        raise ExternalServiceError(f"Failed to fetch profile from {platform}")
    
    # Check if integration already exists
    existing = await repository.get_by_brand_and_platform(db, brand_id, platform)
    
    if existing:
        # Update tokens and profile
        existing.access_token = tokens["access_token"]
        existing.refresh_token = tokens.get("refresh_token")
        existing.token_expires_at = _calculate_token_expiry(tokens.get("expires_in"))
        existing.username = profile["username"]
        existing.platform_account_id = profile["platform_id"]
        existing.profile_picture_url = profile.get("profile_picture_url")
        existing.full_name = profile.get("full_name")
        existing.bio = profile.get("bio")
        existing.followers_count = profile.get("followers_count", 0)
        existing.status = IntegrationStatus.CONNECTED.value
        existing.last_synced = datetime.utcnow()
        
        updated = await repository.update(db, existing)
        logger.info(f"Integration updated: {existing.id} ({platform}) for brand {brand_id}")
        return updated
    
    # Create new integration
    integration_id = f"integ_{uuid.uuid4().hex[:12]}"
    
    integration = PlatformIntegration(
        id=integration_id,
        user_id=user_id,
        brand_id=brand_id,
        platform=platform,
        username=profile["username"],
        platform_account_id=profile["platform_id"],
        access_token=tokens["access_token"],
        refresh_token=tokens.get("refresh_token"),
        token_expires_at=_calculate_token_expiry(tokens.get("expires_in")),
        profile_picture_url=profile.get("profile_picture_url"),
        full_name=profile.get("full_name"),
        bio=profile.get("bio"),
        followers_count=profile.get("followers_count", 0),
        is_business_account=profile.get("is_business_account", False),
        status=IntegrationStatus.CONNECTED.value,
        last_synced=datetime.utcnow()
    )
    
    created = await repository.create(db, integration)
    logger.info(f"Integration created: {integration_id} ({platform}) for brand {brand_id}")
    return created


# ═════════════════════════════════════════════════
#  CRUD Operations
# ═════════════════════════════════════════════════

async def get_integration(
    db: AsyncSession,
    integration_id: str,
    user_id: str | None = None
) -> PlatformIntegration:
    """Get integration by ID with optional user verification"""
    
    integration = await repository.get_by_id(db, integration_id)
    if not integration:
        raise NotFoundError(f"Integration {integration_id} not found")
    
    if user_id and integration.user_id != user_id:
        raise PermError(f"User {user_id} cannot access integration {integration_id}")
    
    return integration


async def list_brand_integrations(
    db: AsyncSession,
    brand_id: str,
    user_id: str | None = None
) -> list[PlatformIntegration]:
    """Get all integrations for a brand"""
    
    integrations = await repository.get_by_brand(db, brand_id)
    logger.debug(f"Listed {len(integrations)} integrations for brand {brand_id}")
    return integrations


async def list_connected_integrations(
    db: AsyncSession,
    brand_id: str
) -> list[PlatformIntegration]:
    """Get only connected integrations for a brand"""
    
    integrations = await repository.get_connected_integrations(db, brand_id)
    return integrations


async def update_integration(
    db: AsyncSession,
    integration_id: str,
    payload: UpdateIntegrationRequest,
    user_id: str | None = None
) -> PlatformIntegration:
    """Update integration settings"""
    
    integration = await get_integration(db, integration_id, user_id)
    
    if payload.publishing_config is not None:
        integration.publishing_config = payload.publishing_config.model_dump()
    
    if payload.status is not None:
        integration.status = payload.status
    
    integration.updated_at = datetime.utcnow()
    updated = await repository.update(db, integration)
    logger.info(f"Integration updated: {integration_id}")
    return updated


async def disconnect_integration(
    db: AsyncSession,
    integration_id: str,
    user_id: str | None = None
) -> PlatformIntegration:
    """Disconnect integration (revoke tokens, mark disconnected)"""
    
    integration = await get_integration(db, integration_id, user_id)
    
    # TODO: Revoke tokens at platform (Instagram, TikTok, etc.)
    
    integration.status = IntegrationStatus.DISCONNECTED.value
    integration.access_token = None  # Clear tokens
    integration.refresh_token = None
    integration.error_message = None
    
    updated = await repository.update(db, integration)
    logger.info(f"Integration disconnected: {integration_id}")
    return updated


async def delete_integration(
    db: AsyncSession,
    integration_id: str,
    user_id: str | None = None
) -> None:
    """Delete integration"""
    
    integration = await get_integration(db, integration_id, user_id)
    await repository.delete(db, integration)
    logger.info(f"Integration deleted: {integration_id}")


# ═════════════════════════════════════════════════
#  Publishing
# ═════════════════════════════════════════════════

async def publish_post(
    db: AsyncSession,
    integration_id: str,
    post_content: dict,
    user_id: str | None = None
) -> dict:
    """
    Publish post to connected platform.
    
    Args:
        db: Database session
        integration_id: Platform integration to publish to
        post_content: Post object with slides, caption, hashtags
        user_id: User publishing (optional verification)
    
    Returns:
        Publication result with post URL and platform ID
    
    Raises:
        NotFoundError: If integration not found
        ExternalServiceError: If platform API fails
    """
    
    integration = await get_integration(db, integration_id, user_id)
    
    if integration.status != IntegrationStatus.CONNECTED.value:
        raise ValidationError(f"Cannot publish: integration status is {integration.status}")
    
    # Check token expiry and refresh if needed
    if integration.token_expires_at and integration.token_expires_at < datetime.utcnow():
        if not integration.refresh_token:
            raise ValidationError("Token expired and no refresh token available")
        
        try:
            new_tokens = await _refresh_access_token(integration.platform, integration.refresh_token)
            integration.access_token = new_tokens["access_token"]
            integration.token_expires_at = _calculate_token_expiry(new_tokens.get("expires_in"))
            await repository.update(db, integration)
        except Exception as e:
            logger.error(f"Token refresh failed: {e}")
            raise ExternalServiceError("Failed to refresh authentication")
    
    # Publish to platform (platform-specific logic)
    try:
        result = await _publish_to_platform(
            integration.platform,
            integration.access_token,
            post_content
        )
        
        logger.info(f"Post published to {integration.platform} via integration {integration_id}")
        return result
    
    except Exception as e:
        logger.error(f"Publishing failed: {e}")
        integration.error_message = str(e)
        integration.status = IntegrationStatus.FAILED.value
        await repository.update(db, integration)
        raise ExternalServiceError(f"Failed to publish to {integration.platform}")


# ═════════════════════════════════════════════════
#  Platform-Specific Helpers (TODO: Implement)
# ═════════════════════════════════════════════════

async def _exchange_auth_code(platform: str, auth_code: str) -> dict:
    """
    Exchange authorization code for access tokens.
    
    TODO: Implement for each platform:
    - Instagram: Facebook Graph API
    - TikTok: TikTok API
    - YouTube: Google API
    """
    
    return {
        "access_token": "placeholder_token",
        "refresh_token": "placeholder_refresh",
        "expires_in": 3600,
    }


async def _fetch_platform_profile(platform: str, access_token: str) -> dict:
    """
    Fetch user profile from platform.
    
    TODO: Implement for each platform
    """
    
    return {
        "username": "placeholder_user",
        "platform_id": "placeholder_id",
        "full_name": "Placeholder User",
        "bio": "Placeholder Bio",
        "profile_picture_url": "https://example.com/pic.jpg",
        "followers_count": 1000,
        "is_business_account": False,
    }


async def _refresh_access_token(platform: str, refresh_token: str) -> dict:
    """
    Refresh access token using refresh token.
    
    TODO: Implement for each platform
    """
    
    return {
        "access_token": "new_token",
        "expires_in": 3600,
    }


async def _publish_to_platform(platform: str, access_token: str, post_content: dict) -> dict:
    """
    Publish post content to platform.
    
    TODO: Implement for each platform
    """
    
    return {
        "success": True,
        "post_url": "https://example.com/post",
        "platform_post_id": "placeholder_post_id",
        "published_at": datetime.utcnow().isoformat(),
    }


def _calculate_token_expiry(expires_in: int | None) -> datetime | None:
    """Calculate token expiration datetime from expires_in seconds"""
    if not expires_in:
        return None
    return datetime.utcnow() + timedelta(seconds=expires_in)
