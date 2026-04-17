"""
User service - business logic for user operations
All functions are async and use the repository for data access.
Services should never raise HTTPException; use app.core.exceptions instead.
"""

import logging
from typing import Optional

from app.core.database import get_db_session
from app.features.user.repository import UserRepository
from app.features.user.schemas import UserCreate, UserUpdate
from app.features.user.models import User
from app.core.security import hash_password, verify_password, create_access_token
from app.core.exceptions import NotFoundError, ConflictError, AuthenticationError

logger = logging.getLogger(__name__)

class UserService:
    """Business logic for user operations."""

    def __init__(self, repository: Optional[UserRepository] = None):
        self.repository = repository or UserRepository()

    async def _get_user_or_raise(self, db, user_id: int) -> User:
        user = await self.repository.get_by_id(db, user_id)
        if not user:
            raise NotFoundError("User", user_id)
        return user

    async def register_user(self, payload: UserCreate) -> User:
        """Register a new user."""
        async with get_db_session() as db:
            existing = await self.repository.get_by_email(db, payload.email)
            if existing:
                raise ConflictError(f"Email {payload.email} is already registered")

            user = User(
                email=payload.email,
                hashed_password=hash_password(payload.password),
            )
            return await self.repository.create(db, user)

    async def get_user(self, user_id: int) -> User:
        """Get a user by id."""
        async with get_db_session() as db:
            return await self._get_user_or_raise(db, user_id)

    async def authenticate_user(self, email: str, password: str) -> str:
        """Authenticate user and return JWT token."""
        async with get_db_session() as db:
            user = await self.repository.get_by_email(db, email)
            if not user or not verify_password(password, user.hashed_password):
                raise AuthenticationError("Invalid email or password")
            return create_access_token({"sub": str(user.id)})

    async def update_user(self, user_id: int, payload: UserUpdate) -> User:
        """Update user profile."""
        async with get_db_session() as db:
            user = await self._get_user_or_raise(db, user_id)

            if payload.email and payload.email != user.email:
                existing = await self.repository.get_by_email(db, payload.email)
                if existing:
                    raise ConflictError(f"Email {payload.email} is already in use")
                user.email = payload.email

            return await self.repository.update(db, user)

    async def deactivate_user(self, user_id: int) -> None:
        """Deactivate user (soft delete)."""
        async with get_db_session() as db:
            user = await self._get_user_or_raise(db, user_id)
            user.is_active = False
            await self.repository.update(db, user)


def get_user_service() -> UserService:
    """Create a request-scoped user service."""
    return UserService()


__all__ = ["UserService", "get_user_service"]
