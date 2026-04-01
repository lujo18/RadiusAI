"""
Security utilities for JWT validation and authentication
"""

import logging
from datetime import datetime, timedelta, UTC
from typing import Optional
from fastapi import Depends, HTTPException, Header
import jwt
from jwt import PyJWKClient
from passlib.context import CryptContext
from app.core.config import settings

logger = logging.getLogger(__name__)

# ═════════ Password Hashing ═════════
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


# ═════════ JWT Token Generation ═════════


def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None,
    secret_key: Optional[str] = None,
) -> str:
    """
    Create a JWT access token

    Args:
        data: Claims to encode (e.g. {"sub": user_id})
        expires_delta: Token expiration time (default: 30 days)
        secret_key: Signing key (default: uses settings.SUPABASE_JWT_SECRET or a fallback)

    Returns:
        JWT token string
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(days=30)

    to_encode.update({"exp": expire, "iat": datetime.now(UTC)})

    key = secret_key or settings.SUPABASE_JWT_SECRET or "dev-secret-key"
    encoded_jwt = jwt.encode(to_encode, key, algorithm="HS256")
    return encoded_jwt


# ═════════ JWT Validation ═════════


async def get_current_user(authorization: Optional[str] = Header(None)) -> str:
    """
    Verify Supabase JWT token and return user ID

    Args:
        authorization: Bearer token from Authorization header

    Returns:
        user_id (UUID str)

    Raises:
        HTTPException: 401 if token is missing, invalid, or expired

    Usage:
        @router.get("/protected")
        async def protected_route(user_id: str = Depends(get_current_user)):
            return {"user_id": user_id}
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    # Extract token from "Bearer <token>"
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=401, detail="Invalid authorization header format"
        )

    token = parts[1]

    try:
        # Verify Supabase JWT token using JWT secret (HS256)
        if settings.SUPABASE_JWT_SECRET:
            decoded_token = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
            )
        else:
            # Fallback: Use JWKS endpoint (RS256, auto-rotating keys)
            jwks_url = f"{settings.SUPABASE_URL}/auth/v1/jwks"
            jwks_client = PyJWKClient(jwks_url)
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            decoded_token = jwt.decode(
                token, signing_key.key, algorithms=["RS256"], audience="authenticated"
            )

        user_id = decoded_token.get("sub")  # Supabase uses 'sub' for user ID
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: no user ID")

        return user_id

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
