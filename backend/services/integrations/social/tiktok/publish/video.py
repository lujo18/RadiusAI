"""
TikTok Video publisher.

Uses TikTok Content Posting API v2 with media_type=VIDEO and
source=PULL_FROM_URL (TikTok fetches the video from our public URL).

TikTok video limits:
  - Duration: 3 s – 10 min
  - Formats: MP4 / WebM
  - Max file size: 4 GB
  - Aspect ratios: 9:16 / 1:1 / 16:9
  - Scheduling: provide `scheduled_publish_time` as Unix timestamp (10 min – 10 days ahead)

For file-upload flow (chunk upload to TikTok servers):
  1. POST /v2/post/publish/video/init/   → uploadUrl + publish_id
  2. PUT  <uploadUrl>                    → upload binary in chunks
  3. Wait for webhook / poll status
This module uses the pull-from-URL shortcut (simpler, works for Supabase public URLs).

Docs: https://developers.tiktok.com/doc/content-posting-api-reference-direct-post
"""

from typing import Optional
from backend.features.error.helper import api_error
from services.integrations.supabase.db.post import update_post
from ..client import TikTokClient

PRIVACY_PUBLIC = "PUBLIC_TO_EVERYONE"
PRIVACY_FRIENDS = "MUTUAL_FOLLOW_FRIENDS"
PRIVACY_SELF = "SELF_ONLY"


async def publish_video(
    client: TikTokClient,
    raw_post: dict,
    post_id: str,
    # --- TikTok-specific settings ---
    privacy_level: str = PRIVACY_PUBLIC,
    disable_duet: bool = False,
    disable_stitch: bool = False,
    disable_comment: bool = False,
    brand_content_toggle: bool = False,
    brand_organic_toggle: bool = False,
    is_ai_generated: bool = False,
    # Unix timestamp for scheduled publish (None = post immediately)
    scheduled_publish_time: Optional[int] = None,
    # Override title / caption
    title_override: Optional[str] = None,
    caption_override: Optional[str] = None,
) -> dict:
    """
    Publish a video to TikTok via direct Content Posting API (pull-from-URL).

    Expects `raw_post["storage_urls"]["video"]` to be a publicly accessible
    video URL (Supabase storage public bucket or CDN link).

    Returns a dict with publish_id.
    Updates the Supabase post row to status='posting'.
    """
    storage = raw_post.get("storage_urls") or {}
    video_url: Optional[str] = (
        storage.get("video") if isinstance(storage, dict) else None
    )

    if not video_url:
        # Fall back to first slide URL if a video wasn't generated separately
        slides = storage.get("slides", []) if isinstance(storage, dict) else []
        video_url = slides[0] if slides else None

    if not video_url:
        api_error(400, "NO_VIDEO", f"Post {post_id} has no video URL in storage_urls")

    # -- Caption / title ----------------------------------------------------
    content = raw_post.get("content") or {}
    caption: str = caption_override or (
        content.get("caption", "") if isinstance(content, dict) else ""
    )
    hashtags: list = (
        content.get("hashtags", []) if isinstance(content, dict) else []
    )
    hashtag_str = " ".join(f"#{h}" for h in (hashtags or []))
    full_caption = f"{caption} {hashtag_str}".strip()[:2200]

    title: str = title_override or caption or ""
    title = title[:150]

    # -- Payload ------------------------------------------------------------
    post_info: dict = {
        "title": title,
        "description": full_caption,
        "privacy_level": privacy_level,
        "disable_duet": disable_duet,
        "disable_stitch": disable_stitch,
        "disable_comment": disable_comment,
        "brand_content_toggle": brand_content_toggle,
        "brand_organic_toggle": brand_organic_toggle,
        "is_aigc": is_ai_generated,
    }

    if scheduled_publish_time:
        post_info["scheduled_publish_time"] = scheduled_publish_time

    payload = {
        "post_info": post_info,
        "source_info": {
            "source": "PULL_FROM_URL",
            "video_url": video_url,
        },
        "media_type": "VIDEO",
        "post_mode": "DIRECT_POST",
    }

    response = await client.post("/post/publish/content/init/", payload)

    publish_id: Optional[str] = (
        response.get("data", {}).get("publish_id")
        or response.get("publish_id")
    )

    print(f"[TikTok] Video publish initiated. publish_id={publish_id}")

    updates: dict = {"status": "posting"}
    if publish_id:
        updates["external_post_id"] = publish_id

    update_post(post_id, updates)

    return {"publish_id": publish_id, "status": "posting", "type": "video"}


# ---------------------------------------------------------------------------
# Status check helper (optional – call from a background task or webhook)
# ---------------------------------------------------------------------------


async def check_publish_status(client: TikTokClient, publish_id: str) -> dict:
    """
    Poll TikTok for the current status of a video publish job.

    Possible statuses: PROCESSING_UPLOAD, PROCESSING_DOWNLOAD,
                       PUBLISH_COMPLETE, FAILED, CANCELLED
    """
    response = await client.post(
        "/post/publish/status/fetch/",
        {"publish_id": publish_id},
    )
    return response.get("data", {})
