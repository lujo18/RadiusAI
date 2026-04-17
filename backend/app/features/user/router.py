"""
User HTTP endpoints - registration, authentication, profile management
"""

import logging
from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user
from app.core.exceptions import AppError
from app.features.user.service import UserService, get_user_service
from app.features.user.models import User
from app.features.user.schemas import (
    UserCreate,
    UserUpdate,
    UserResponse,
    TokenResponse,
    LoginRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={
        401: {"description": "Unauthorized"},
        404: {"description": "Not Found"},
        409: {"description": "Conflict"},
    },
)


# ═════════════════════════════════════════════════
#  Public Endpoints (No Auth Required)
# ═════════════════════════════════════════════════


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(
    payload: UserCreate,
    user_service: UserService = Depends(get_user_service),
):
    """
    Register a new user

    - **email**: User email address (must be unique)
    - **password**: User password (will be hashed)

    Returns the created user (without password)
    """
    try:
        user = await user_service.register_user(payload)
        logger.info(f"User registered: {user.email}")
        return user
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    user_service: UserService = Depends(get_user_service),
):
    """
    Authenticate user and receive JWT token

    - **email**: User email
    - **password**: User password

    Returns access_token (use in Authorization: Bearer <token> header)
    """
    try:
        token = await user_service.authenticate_user(payload.email, payload.password)
        logger.info(f"User login: {payload.email}")
        return {"access_token": token, "token_type": "bearer"}
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


# ═════════════════════════════════════════════════
#  Protected Endpoints (Auth Required)
# ═════════════════════════════════════════════════


@router.get("/me", response_model=UserResponse)
async def get_current_profile(
    user_id: str = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
):
    """
    Get current user profile

    Requires: Authorization: Bearer <token>
    """
    try:
        user = await user_service.get_user(int(user_id))
        return user
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.patch("/me", response_model=UserResponse)
async def update_current_profile(
    payload: UserUpdate,
    user_id: str = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
):
    """
    Update current user profile

    Requires: Authorization: Bearer <token>

    - **email**: (optional) New email address
    """
    try:
        user = await user_service.update_user(int(user_id), payload)
        logger.info(f"User updated: {user.id}")
        return user
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.delete("/me", status_code=204)
async def deactivate_current_user(
    user_id: str = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
):
    """
    Deactivate current user account (soft delete)

    Requires: Authorization: Bearer <token>
    """
    try:
        await user_service.deactivate_user(int(user_id))
        logger.info(f"User deactivated: {user_id}")
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
