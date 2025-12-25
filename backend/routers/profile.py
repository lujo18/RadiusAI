from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from services.late.profile import create_profile

from backend.auth import get_current_user  # Assuming auth is set up in backend/auth.py

router = APIRouter()

class CreateProfileRequest(BaseModel):
  profile_name: str
  profile_description: str = None

@router.post("/create-profile")
async def create_profile(
  request: CreateProfileRequest,
  current_user: dict = Depends(get_current_user)
):
  try:
    profile = await create_profile(
      user_id=current_user["id"],
      name=request.profile_name,
      description=request.profile_description
    )
    return {"profile": profile}
  except Exception as e:
    raise HTTPException(status_code=400, detail=str(e))