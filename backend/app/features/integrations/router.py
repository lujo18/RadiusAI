"""
Platform Integration HTTP endpoints - OAuth and account management
"""

import logging
import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.exceptions import AppError
from app.features.integrations import service
from app.features.integrations.schemas import (
    InitiateOAuthRequest, CompleteOAuthRequest, UpdateIntegrationRequest,
    PlatformIntegrationResponse, PlatformIntegrationShortResponse,
    OAuthCallbackResponse, PublishResponse
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/integrations",
    tags=["integrations"],
    responses={
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden"},
        404: {"description": "Not Found"},
    }
)


# ═════════════════════════════════════════════════
#  OAuth Flow
# ═════════════════════════════════════════════════

@router.post("/oauth/initiate", response_model=OAuthCallbackResponse)
async def initiate_oauth(
    request: InitiateOAuthRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Initiate OAuth flow for a platform.
    Returns OAuth URL for user to visit.
    
    Requires: Authorization: Bearer <token>
    """
    try:
        # Generate CSRF token
        state = secrets.token_urlsafe(32)
        
        # Store state in session/cache (TODO: implement state management)
        # For now, just generate the OAuth URL
        
        oauth_url = await service.generate_oauth_url(
            request.platform,
            request.brand_id,
            state
        )
        
        return OAuthCallbackResponse(
            success=True,
            message=f"Visit this URL to authorize {request.platform}",
            oauth_url=oauth_url
        )
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.post("/oauth/callback", response_model=OAuthCallbackResponse)
async def oauth_callback(
    request: CompleteOAuthRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Complete OAuth flow with authorization code.
    
    Requires: Authorization: Bearer <token>
    """
    try:
        # TODO: Validate state token
        
        integration = await service.complete_oauth_flow(
            db=db,
            user_id=user_id,
            brand_id=request.brand_id,
            platform=request.platform,
            auth_code=request.auth_code
        )
        
        await db.commit()
        
        return OAuthCallbackResponse(
            success=True,
            message=f"Successfully authenticated with {request.platform}",
            integration=PlatformIntegrationResponse.model_validate(integration)
        )
    except AppError as e:
        await db.rollback()
        raise HTTPException(status_code=e.status_code, detail=e.detail)


# ═════════════════════════════════════════════════
#  List Integrations
# ═════════════════════════════════════════════════

@router.get("/brand/{brand_id}", response_model=list[PlatformIntegrationShortResponse])
async def list_brand_integrations(
    brand_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all integrations for a brand"""
    try:
        integrations = await service.list_brand_integrations(db, brand_id, user_id)
        return integrations
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.get("/brand/{brand_id}/connected", response_model=list[PlatformIntegrationShortResponse])
async def list_connected_integrations(
    brand_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get only connected integrations"""
    try:
        integrations = await service.list_connected_integrations(db, brand_id)
        return integrations
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


# ═════════════════════════════════════════════════
#  Get Integration
# ═════════════════════════════════════════════════

@router.get("/{integration_id}", response_model=PlatformIntegrationResponse)
async def get_integration(
    integration_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get integration details"""
    try:
        integration = await service.get_integration(db, integration_id, user_id)
        return integration
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


# ═════════════════════════════════════════════════
#  Update Integration
# ═════════════════════════════════════════════════

@router.patch("/{integration_id}", response_model=PlatformIntegrationResponse)
async def update_integration(
    integration_id: str,
    payload: UpdateIntegrationRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update integration settings"""
    try:
        integration = await service.update_integration(db, integration_id, payload, user_id)
        await db.commit()
        logger.info(f"Integration updated: {integration_id}")
        return integration
    except AppError as e:
        await db.rollback()
        raise HTTPException(status_code=e.status_code, detail=e.detail)


# ═════════════════════════════════════════════════
#  Disconnect Integration
# ═════════════════════════════════════════════════

@router.post("/{integration_id}/disconnect", response_model=PlatformIntegrationResponse)
async def disconnect_integration(
    integration_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Disconnect and revoke tokens"""
    try:
        integration = await service.disconnect_integration(db, integration_id, user_id)
        await db.commit()
        logger.info(f"Integration disconnected: {integration_id}")
        return integration
    except AppError as e:
        await db.rollback()
        raise HTTPException(status_code=e.status_code, detail=e.detail)


# ═════════════════════════════════════════════════
#  Delete Integration
# ═════════════════════════════════════════════════

@router.delete("/{integration_id}", status_code=204)
async def delete_integration(
    integration_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete integration"""
    try:
        await service.delete_integration(db, integration_id, user_id)
        await db.commit()
        logger.info(f"Integration deleted: {integration_id}")
    except AppError as e:
        await db.rollback()
        raise HTTPException(status_code=e.status_code, detail=e.detail)


# ═════════════════════════════════════════════════
#  Publishing
# ═════════════════════════════════════════════════

@router.post("/{integration_id}/publish", response_model=PublishResponse)
async def publish_post(
    integration_id: str,
    post_content: dict,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Publish post to connected platform.
    
    Requires: Authorization: Bearer <token>
    """
    try:
        result = await service.publish_post(
            db=db,
            integration_id=integration_id,
            post_content=post_content,
            user_id=user_id
        )
        
        await db.commit()
        return PublishResponse(
            success=result["success"],
            message="Post published successfully",
            post_url=result.get("post_url"),
            platform_post_id=result.get("platform_post_id"),
            published_at=result.get("published_at")
        )
    except AppError as e:
        await db.rollback()
        if e.status_code == 402:
            return PublishResponse(
                success=False,
                message="Publishing quota exceeded",
                error_details=e.detail
            )
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        await db.rollback()
        return PublishResponse(
            success=False,
            message="Publishing failed",
            error_details=str(e)
        )
