"""
Authentication utilities for FastAPI
"""

from fastapi import Depends, HTTPException, Header, Query
from typing import Optional, Union, Dict, Any
import jwt
from jwt import PyJWKClient
from config import Config

SUPABASE_URL = Config.SUPABASE_URL
SUPABASE_JWT_SECRET = Config.SUPABASE_JWT_SECRET


class PublicTeamAccess:
    """Represents public access to a team without user authentication"""
    def __init__(self, team_id: str):
        self.team_id = team_id
        self.is_public = True
    
    def __str__(self):
        return f"PublicTeamAccess(team_id={self.team_id})"

async def get_current_user(authorization: Optional[str] = Header(None)) -> str:
    """
    Verify Supabase JWT token and return user ID
    
    Usage in routes:
    @router.get("/protected")
    async def protected_route(user_id: str = Depends(get_current_user)):
        return {"userId": user_id}
    """
    print(f"\n🔑 get_current_user called")
    print(f"   Authorization header present: {bool(authorization)}")
    
    if not authorization:
        print(f"   ❌ No authorization header")
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    # Extract token from "Bearer <token>"
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        print(f"   ❌ Invalid authorization header format")
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    
    token = parts[1]
    
    # Debug logging
    print(f"   Token preview: {token[:50]}...")
    print(f"   Has JWT Secret: {bool(SUPABASE_JWT_SECRET)}")
    
    try:
        # Verify Supabase JWT token
        # Option 1: Using JWT secret (faster)
        if SUPABASE_JWT_SECRET:
            print(f"   Using HS256 with JWT secret")
            decoded_token = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated"
            )
            print(f"   ✅ Token valid! User ID: {decoded_token.get('sub')}")
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
    except jwt.ExpiredSignatureError as e:
        print(f"   ❌ Token expired: {e}")
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        print(f"   ❌ Invalid token: {e}")
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


async def get_current_user_or_public_team(
    team_id: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None)
) -> Union[str, PublicTeamAccess]:
    """
    Get current user OR allow public team access if team_id is provided and team.is_public=true.
    
    Priority:
    1. If team_id provided, check if team is public → return PublicTeamAccess
    2. Otherwise, require authentication → return user_id
    
    Usage in routes:
    @router.get("/api/account/info")
    async def account_info(access: Union[str, PublicTeamAccess] = Depends(get_current_user_or_public_team)):
        if isinstance(access, PublicTeamAccess):
            team_id = access.team_id
            # Handle public team logic
        else:
            user_id = access  # String user ID
            # Handle authenticated user logic
    """
    print(f"\n🔐 get_current_user_or_public_team called:")
    print(f"   team_id param: {team_id}")
    print(f"   auth header: {authorization[:50] if authorization else 'None'}...")
    
    # If team_id provided, check if it's a public team
    if team_id:
        try:
            from services.integrations.supabase.client import get_supabase
            supabase = get_supabase()
            
            print(f"🔍 Checking public team access: team_id={team_id}")
            
            # Query the team by ID and check is_public
            response = supabase.table("teams").select("id, is_public").eq("id", team_id).single().execute()
            team = response.data
            
            print(f"   Team query result: {team}")
            
            if not team:
                print(f"   ❌ Team not found")
                raise HTTPException(status_code=404, detail=f"Team {team_id} not found")
            
            is_public = team.get("is_public", False)
            print(f"   is_public={is_public}")
            
            if is_public:
                print(f"   ✅ Public team access granted")
                return PublicTeamAccess(team_id)
            else:
                print(f"   ❌ Team is not public, requiring authentication")
        except HTTPException:
            raise
        except Exception as e:
            print(f"❌ Error checking public team {team_id}: {e}")
            import traceback
            traceback.print_exc()
            # If we can't verify, require authentication
            pass
    else:
        print(f"   ℹ️  No team_id in query params")
    
    # Fall back to requiring authentication
    print(f"🔐 No public team access, requiring authentication")
    return await get_current_user(authorization)
