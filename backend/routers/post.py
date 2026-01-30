import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Literal

from backend.models.post import Post
from backend.models.user import BrandSettings
from backend.services.integrations.social.provider import get_social_provider
from backend.services.integrations.supabase.db.post import get_post
from backend.services.profile.connect_account import connect_social

from backend.auth import get_current_user
from backend.services.profile.post import (
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
  

@router.post("/")
async def make_post(request: MakePostRequest):
  """
  Create/publish/schedule a post via social provider.
  
  Args:
    request: Contains brand_id, platforms, post_id, mode, and optional scheduled_at
    
  Modes:
    - "publish": Immediately publish the post
    - "draft": Save as draft 
    - "scheduled": Schedule for future posting (requires scheduled_at)
  """
  try:
    if request.mode == "scheduled" and not request.scheduled_at:
      raise HTTPException(status_code=400, detail="scheduled_at is required for scheduled mode")
    
    # Call the appropriate method based on mode
    if request.mode == "publish":
      res = await provider.publish_post(request.brand_id, request.platforms, request.post_id)
    elif request.mode == "draft":
      res = await provider.draft_post(request.brand_id, request.platforms, request.post_id)
    elif request.mode == "scheduled":
      res = await provider.schedule_post(
        request.brand_id, 
        request.platforms, 
        request.post_id, 
        request.scheduled_at
      )
    else:
      raise HTTPException(status_code=400, detail=f"Invalid mode: {request.mode}")
    
    logger.info(f"Successfully {request.mode} post {request.post_id} to platforms {request.platforms}")
    return res
    
  except Exception as e:
    logger.error(f"Failed to {request.mode} post {request.post_id}: {str(e)}")
    raise HTTPException(status_code=500, detail=f"Failed to {request.mode} post: {str(e)}")


# DELEGATE: SAVE THIS, adapt the postforme implementation to work in unison with late

@router.post("/slideshow")
def post_slideshow(request: PostSlideshow, user_id: str = Depends(get_current_user)):
  
  post = get_post(request.post_id, user_id)
  
  if post is None:
    raise HTTPException(status_code=404, detail="Post not found")
  if isinstance(post, dict):
    post = Post(**post)

  response = send_post(post=post, lateAccountId=request.late_account_id, publishNow=request.publish_now)
  
  if response:
    logger.info("Successfully made post")
  else:
    logger.info("Failed to make post")
    
  return response
  

