"""
Authentication utilities for FastAPI
"""

from typing import Optional
from fastapi import HTTPException, Header
import jwt
from jwt import PyJWKClient

from app.core.config import settings


SUPABASE_URL = settings.SUPABASE_URL
SUPABASE_JWT_SECRET = settings.SUPABASE_JWT_SECRET


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
        raise HTTPException(
            status_code=401, detail="Invalid authorization header format"
        )

    token = parts[1]

    # Debug logging
    print("🔑 Attempting JWT verification")
    print("   Has JWT Secret: {}".format(bool(SUPABASE_JWT_SECRET)))
    print("   Token preview: {}...".format(token[:50]))

    try:
        # Verify Supabase JWT token
        # Option 1: Using JWT secret (faster)
        if SUPABASE_JWT_SECRET:
            print("   Using HS256 with JWT secret")
            decoded_token = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
            )
            print(f"   ✅ Token valid! User ID: {decoded_token.get('sub')}")
        else:
            # Option 2: Using JWKS endpoint (more secure, auto key rotation)
            jwks_url = f"{SUPABASE_URL}/auth/v1/jwks"
            jwks_client = PyJWKClient(jwks_url)
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            decoded_token = jwt.decode(
                token, signing_key.key, algorithms=["RS256"], audience="authenticated"
            )

        user_id = decoded_token["sub"]  # Supabase uses 'sub' for user ID
        return user_id
    except jwt.ExpiredSignatureError as e:
        print("   ❌ Token expired: {}".format(e))
        raise HTTPException(status_code=401, detail="Token has expired") from e
    except jwt.InvalidTokenError as e:
        print("   ❌ Invalid token: {}".format(e))
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}") from e
