"""
TikTok Photo Slideshow (Carousel) publisher.

Uses TikTok Content Posting API v2:
  POST /v2/post/publish/content/init/   → request publish, get publish_id
  GET  /v2/post/publish/status/fetch/   → poll completion (optional – we fire-and-forget)

TikTok photo carousel limits:
  - 2–35 images
  - Supported formats: JPEG / PNG / WEBP
  - Max file size: 20 MB per image
  - Aspect ratio: 9:16 recommended but 1:1 and 4:5 also accepted
  - Auto-add music: supported via `auto_add_music: true`

Docs: https://developers.tiktok.com/doc/content-posting-api-reference-direct-post
"""

from typing import Optional
from backend.features.error.helper import api_error
from services.integrations.supabase.db.post import update_post
from ..client import TikTokClient

# TikTok privacy level options
PRIVACY_PUBLIC = "PUBLIC_TO_EVERYONE"
PRIVACY_FRIENDS = "MUTUAL_FOLLOW_FRIENDS"
PRIVACY_SELF = "SELF_ONLY"


async def publish_slideshow(
    client: TikTokClient,
    raw_post: dict,
    post_id: str,
    # --- TikTok-specific settings (all optional with sensible defaults) ---
    privacy_level: str = PRIVACY_PUBLIC,
    disable_duet: bool = False,
    disable_stitch: bool = False,
    disable_comment: bool = False,
    auto_add_music: bool = True,
    brand_content_toggle: bool = False,
    brand_organic_toggle: bool = False,
    is_ai_generated: bool = False,
    # Override caption / title if you want something different from post content
    caption_override: Optional[str] = None,
    title_override: Optional[str] = None,
) -> dict:
    """
    Publish a photo carousel to TikTok via direct Content Posting API.

    Reads slide image URLs from `raw_post["storage_urls"]["slides"]` and the
    caption + hashtags from `raw_post["content"]`.

    Returns a dict with publish_id (or error details).
    The Supabase post row is updated to status='posting' and external_post_id=publish_id.
    """
    # -- Build image list ---------------------------------------------------
    storage = raw_post.get("storage_urls") or {}
    slides: list = (
        storage.get("slides") if isinstance(storage, dict) else []
    ) or []

    if not slides:
        api_error(400, "NO_SLIDES", f"Post {post_id} has no slide URLs to publish as a slideshow")

    if len(slides) < 2:
        api_error(
            400,
            "INSUFFICIENT_SLIDES",
            f"TikTok photo carousels require at least 2 images (post {post_id} has {len(slides)})",
        )
        

    photo_images = [f'https://api.useradius.app/media/image/{url.split("slides/")[1]}' for url in slides[:35]]  # TikTok max = 35

    # -- Build caption ------------------------------------------------------
    content = raw_post.get("content") or {}
    caption: str = caption_override or (
        content.get("caption", "") if isinstance(content, dict) else ""
    )
    hashtags: list = (
        content.get("hashtags", []) if isinstance(content, dict) else []
    )
    hashtag_str = " ".join(f"#{h}" for h in (hashtags or []))
    full_caption = f"{caption} {hashtag_str}".strip()

    # Normalize whitespace: collapse newlines and excess spaces that may come
    # from AI-generated content or template literals
    import re
    def _normalize(text: str) -> str:
        return re.sub(r"\s+", " ", text).strip()

    full_caption = _normalize(full_caption)
    # TikTok photo description max = 4000 UTF-16 runes (video is 2200)
    full_caption = full_caption[:4000]

    # Title for photo posts max = 90 UTF-16 runes (video title is 150)
    title: str = _normalize(title_override or caption or "Check this out")
    title = title[:90]

    # -- Payload ------------------------------------------------------------
    # Only include optional boolean fields when non-default (True) — TikTok
    # validates permission scopes even for `false` values on privileged fields.
    post_info: dict = {
        "title": title,
        "description": full_caption,
        "privacy_level": privacy_level,
        "auto_add_music": auto_add_music,
    }
    if disable_comment:
        post_info["disable_comment"] = True
    if brand_content_toggle:
        post_info["brand_content_toggle"] = True
    if brand_organic_toggle:
        post_info["brand_organic_toggle"] = True

    payload = {
        "post_info": post_info,
        "source_info": {
            "source": "PULL_FROM_URL",
            "photo_images": photo_images,
            "photo_cover_index": 0,
        },
        "media_type": "PHOTO",
        "post_mode": "DIRECT_POST",
    }

    print("PAYLOAD FOR POST", payload)
    try:
        response = await client.post("/post/publish/content/init/", payload)
    except Exception as e:
        api_error(400, "POSTING_SLIDESHOW_FAILED", f"An error occured posting slideshow: {e}")
        

    publish_id: Optional[str] = (
        response.get("data", {}).get("publish_id")
        or response.get("publish_id")
    )

    print(f"[TikTok] Slideshow publish initiated. publish_id={publish_id}")

    # Update Supabase post row
    updates: dict = {"status": "posting"}
    if publish_id:
        updates["external_post_id"] = publish_id

    update_post(post_id, updates)

    return {"publish_id": publish_id, "status": "posting", "type": "slideshow"}
