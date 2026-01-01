from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from backend.models.user import BrandSettings
from backend.services.profile.create_profile import create_profile
from services.integrations.late.profile import create_late_profile

from backend.auth import get_current_user  # Assuming auth is set up in backend/auth.py

router = APIRouter()

class CreateProfileRequest(BaseModel):
  user_id: str
  profile_name: str
  profile_description: Optional[str] = None
  brand_settings: dict

@router.post("/create-profile")
async def create_profile_api(
  request: CreateProfileRequest,
  current_user: dict = Depends(get_current_user)
):
  try:
    # Ensure brand_settings is a dict
    brand_settings_dict = request.brand_settings if isinstance(request.brand_settings, dict) else request.brand_settings.dict()
    profile = await create_profile(
      current_user["id"],
      request.profile_name,
      request.profile_description or "",
      brand_settings_dict
    )
    return {"profile": profile}
  except Exception as e:
    raise HTTPException(status_code=400, detail=str(e))