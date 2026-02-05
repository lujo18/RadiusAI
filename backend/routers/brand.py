from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import logging
import json

from auth import get_current_user
from models.user import BrandSettings
from services.genai.client import client
from google.genai import types
from services.integrations.groq.util.GenerateBrand import generate_brand

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

@router.post("/create-profile")
async def create_profile_api(
  request: dict,
  current_user: dict = Depends(get_current_user)
):
  # Placeholder create-profile endpoint (implementation commented earlier)
  raise HTTPException(status_code=501, detail="Not implemented")


class GenerateBrandRequest(BaseModel):
	guideline_prompt: str


@router.post("/generate", response_model=BrandSettings)
async def generate_brand_settings(
	request: GenerateBrandRequest,
	user_id: str = Depends(get_current_user)
):
	"""Generate BrandSettings JSON from a free-text guideline using Gemini.

	Expects the model to return a JSON object matching the BrandSettings schema.
	"""
	try:
		# Optional: kick off any telemetry or pre-processing
		brand_settings = generate_brand(request.guideline_prompt)
		return brand_settings

	except Exception as e:
		logging.error("Error generating brand settings: %s", e, exc_info=True)
		raise HTTPException(status_code=500, detail=str(e))

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