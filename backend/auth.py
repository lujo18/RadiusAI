"""
Authentication utilities for FastAPI
"""

from fastapi import Depends, HTTPException, Header
from typing import Optional
import jwt
from jwt import PyJWKClient
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

async def get_current_user(authorization: Optional[str] = Header(None)) -> str:
    """
    Verify Supabase JWT token and return user ID
    
    Usage in routes:
    @router.get("/protected")
    async def protected_route(user_id: str = Depends(get_current_user)):
        return {"userId": user_id}
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    # Extract token from "Bearer <token>"
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    
    token = parts[1]
    
    try:
        # Verify Supabase JWT token
        # Option 1: Using JWT secret (faster)
        if SUPABASE_JWT_SECRET:
            decoded_token = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated"
            )
        else:
            # Option 2: Using JWKS endpoint (more secure, auto key rotation)
            jwks_url = f"{SUPABASE_URL}/auth/v1/jwks"
            jwks_client = PyJWKClient(jwks_url)
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            decoded_token = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                audience="authenticated"
            )
        
        user_id = decoded_token['sub']  # Supabase uses 'sub' for user ID
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


async def get_optional_user(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """
    Optional authentication - returns user_id if valid token, None otherwise
    """
    if not authorization:
        return None
    
    try:
        return await get_current_user(authorization)
    except HTTPException:
        return None
