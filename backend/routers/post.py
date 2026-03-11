import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Literal

from backend.features.error.helper import api_error
from backend.features.error.response import SuccessResponse
from models.post import Post
from models.user import BrandSettings
from services.integrations.social.provider import get_social_provider
from services.integrations.supabase.db.post import get_post
from services.profile.connect_account import connect_social

from auth import get_current_user
from services.profile.post import (
    send_post,
)  # Assuming auth is set up in backend/auth.py

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/post", tags=["post"])
provider = get_social_provider()

class PostSlideshow(BaseModel):
  post_id: str
  late_account_id: str
  publish_now: bool = False


class MakePostRequest(BaseModel):
  brand_id: str
  platforms: List[str]
  post_id: str
  mode: Literal["publish", "draft", "scheduled"] = "publish"
  scheduled_at: Optional[str] = None  # ISO timestamp for scheduled posts
  

@router.post("/", response_model=SuccessResponse)
async def make_post(request: MakePostRequest, current_user=Depends(get_current_user)):
  """
  Create/publish/schedule a post via social provider.
  
  Args:
    request: Contains brand_id, platforms, post_id, mode, and optional scheduled_at
    
  Modes:
    - "publish": Immediately publish the post
    - "draft": Save as draft 
    - "scheduled": Schedule for future posting (requires scheduled_at)
  """
  if request.mode == "scheduled" and not request.scheduled_at:
    api_error(400, "MISSING_SCHEDULED_AT", "scheduled_at is required for scheduled mode")
  
  if request.mode not in ("publish", "draft", "scheduled"):
    api_error(400, "INVALID_MODE", f"Invalid mode: {request.mode}")

  if request.mode == "publish":
    res = await provider.publish_post(request.brand_id, request.platforms, request.post_id)
  elif request.mode == "draft":
    res = await provider.draft_post(request.brand_id, request.platforms, request.post_id)
  else:
    res = await provider.schedule_post(
      request.brand_id,
      request.platforms,
      request.post_id,
      request.scheduled_at,
    )

  logger.info(f"Successfully {request.mode} post {request.post_id} to platforms {request.platforms}")
  return res


# DELEGATE: SAVE THIS, adapt the postforme implementation to work in unison with late

@router.post("/slideshow")
def post_slideshow(request: PostSlideshow, user_id: str = Depends(get_current_user)):
  
  post = get_post(request.post_id)
  
  if post is None:
    api_error(404, "POST_NOT_FOUND", "Post not found")
  if isinstance(post, dict):
    post = Post(**post)

  response = send_post(post=post, lateAccountId=request.late_account_id, publishNow=request.publish_now)
  
  if response:
    logger.info("Successfully made post")
  else:
    logger.info("Failed to make post")
    
  return response
  

