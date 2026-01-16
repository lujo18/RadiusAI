import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from backend.models.post import Post
from backend.models.user import BrandSettings
from backend.services.integrations.supabase.db.post import get_post
from backend.services.profile.connect_account import connect_social

from backend.auth import get_current_user
from backend.services.profile.post import (
    send_post,
)  # Assuming auth is set up in backend/auth.py

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/post", tags=["post"])


class PostSlideshow(BaseModel):
  post_id: str
  late_account_id: str
  publish_now: bool = False

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
  
