"""
Authentication utilities for FastAPI
"""

from fastapi import Depends, HTTPException, Header
from typing import Optional
import firebase_admin
from firebase_admin import auth

async def get_current_user(authorization: Optional[str] = Header(None)) -> str:
    """
    Verify Firebase ID token and return user ID
    
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
        # Verify Firebase ID token
        decoded_token = auth.verify_id_token(token)
        user_id = decoded_token['uid']
        return user_id
    except Exception as e:
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
