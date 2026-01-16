from fastapi import APIRouter, Depends, HTTPException
# from pydantic import BaseModel
# from typing import Optional

# from backend.models.user import BrandSettings
# from backend.services.profile.connect_account import connect_social
# from backend.services.profile.create_profile import create_profile
# from backend.services.integrations.late.profile import create_late_profile

# from backend.auth import get_current_user  # Assuming auth is set up in backend/auth.py

router = APIRouter(prefix="/api/brand", tags=["brand"])

# class CreateProfileRequest(BaseModel):
#   user_id: str
#   profile_name: str
#   profile_description: Optional[str] = None
#   brand_settings: dict

# FIXME: Reenable and rebuild this for Late/Postforme compatability
# Notes:
"""
Disabled because it only handles creating Late profile in unison with
creating Brand

I need to be able to create a brand again
It is important that a late_profile is created with a brand

Postforme doesn't feature profiles, only social connections unlike late

Postforme:
independant social connections -> my brand

Late:
independant social connections -> late profile <-> my brand
"""



# @router.post("/create-profile")
# async def create_profile_api(
#   request: CreateProfileRequest,
#   current_user: dict = Depends(get_current_user)
# ):
#   try:
#     # Ensure brand_settings is a dict
#     brand_settings_dict = request.brand_settings if isinstance(request.brand_settings, dict) else request.brand_settings.dict()
#     profile = await create_profile(
#       current_user["id"],
#       request.profile_name,
#       request.profile_description or "",
#       brand_settings_dict
#     )
#     return {"profile": profile}
#   except Exception as e:
#     raise HTTPException(status_code=400, detail=str(e))
  

# class ConnectSocialRequest(BaseModel):
#   late_profile_id: str
#   social_platform: str
  
# @router.post("/social-auth-url")
# async def get_social_auth_url(
#   request: ConnectSocialRequest,
# ):
#   try:
#     print("[DEBUG] Incoming social-auth-url request:", request)
#     auth_url = connect_social(
#       request.late_profile_id,
#       request.social_platform
#     )
#     if not auth_url:
#       raise HTTPException(status_code=500, detail="Failed to get authorization URL")
#     return {"auth_url": auth_url}
#   except Exception as e:
#     print("[ERROR] social-auth-url exception:", e)
#     raise HTTPException(status_code=400, detail=str(e))