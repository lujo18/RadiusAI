"""
User service - business logic for user operations
All functions are async and use the repository for data access.
Services should never raise HTTPException; use app.core.exceptions instead.
"""

import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.features.user.repository import UserRepository
from app.features.user.schemas import UserCreate, UserUpdate
from app.features.user.models import User
from app.core.security import hash_password, verify_password, create_access_token
from app.core.exceptions import NotFoundError, ConflictError, AuthenticationError

logger = logging.getLogger(__name__)

repository = UserRepository()

# ════════════════════════════════
#  CREATE
# ════════════════════════════════

async def register_user(db: AsyncSession, payload: UserCreate) -> User:
    """
    Register a new user
    
    Raises:
        ConflictError: If email is already registered
    """
    # Check if email already exists
    existing = await repository.get_by_email(db, payload.email)
    if existing:
        raise ConflictError(f"Email {payload.email} is already registered")
    
    # Create new user with hashed password
    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    
    # Persist to database
    return await repository.create(db, user)


# ════════════════════════════════
#  READ
# ════════════════════════════════

async def get_user(db: AsyncSession, user_id: int) -> User:
    """
    Get user by ID
    
    Raises:
        NotFoundError: If user does not exist
    """
    user = await repository.get_by_id(db, user_id)
    if not user:
        raise NotFoundError("User", user_id)
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> str:
    """
    Authenticate user and return JWT token
    
    Raises:
        AuthenticationError: If credentials are invalid
    """
    user = await repository.get_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        raise AuthenticationError("Invalid email or password")
    
    # Generate JWT token
    token = create_access_token({"sub": str(user.id)})
    return token


# ════════════════════════════════
#  UPDATE
# ════════════════════════════════

async def update_user(db: AsyncSession, user_id: int, payload: UserUpdate) -> User:
    """
    Update user profile
    
    Raises:
        NotFoundError: If user does not exist
        ConflictError: If new email is already in use
    """
    user = await get_user(db, user_id)
    
    # If updating email, check availability
    if payload.email and payload.email != user.email:
        existing = await repository.get_by_email(db, payload.email)
        if existing:
            raise ConflictError(f"Email {payload.email} is already in use")
        user.email = payload.email
    
    # Persist changes
    return await repository.update(db, user)


# ════════════════════════════════
#  DELETE
# ════════════════════════════════

async def deactivate_user(db: AsyncSession, user_id: int) -> None:
    """
    Deactivate user (soft delete)
    
    Raises:
        NotFoundError: If user does not exist
    """
    user = await get_user(db, user_id)
    user.is_active = False
    await repository.update(db, user)
