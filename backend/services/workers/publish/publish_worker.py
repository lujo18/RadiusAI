"""
Publish Worker: Publishes posts whose scheduled_time has arrived.

TikTok's Content Posting API has no native scheduling — posts are always
posted immediately. This worker bridges that gap by:

1. Polling Supabase every minute for posts where
       status = 'scheduled' AND scheduled_time <= now()
2. Dispatching each due post to the appropriate platform publisher
3. Marking posts 'posted' on success or 'failed' on error

Runs on a cron trigger registered in backend/main.py.
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from services.integrations.supabase.client import get_supabase
from services.integrations.supabase.db.post import update_post

logger = logging.getLogger(__name__)

BATCH_SIZE = 20

# ---------------------------------------------------------------------------
# Lazy Supabase client
# ---------------------------------------------------------------------------
_supabase = None


def _get_supabase():
    global _supabase
    if _supabase is None:
        _supabase = get_supabase()
    return _supabase


# ---------------------------------------------------------------------------
# Main entry point (called by cron scheduler)
# ---------------------------------------------------------------------------

async def process_due_posts():
    """
    Find all posts due for posting and dispatch them concurrently.
    Called by the cron scheduler (every 1 minute).
    """
    try:
        now = datetime.now(timezone.utc).isoformat()
        logger.info(f"[publish_worker] Starting run at {now}")

        due_posts = _fetch_due_posts(now)

        if not due_posts:
            logger.info("[publish_worker] No posts due for posting")
            return

        logger.info(f"[publish_worker] Found {len(due_posts)} post(s) due for posting")

        tasks = [_publish_single_post(post) for post in due_posts]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        success_count = sum(1 for r in results if not isinstance(r, Exception))
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(
                    f"[publish_worker] Unhandled error for post {due_posts[i]['id']}: {result}",
                    exc_info=result,
                )

        logger.info(
            f"[publish_worker] Completed: {success_count}/{len(due_posts)} posted successfully"
        )

    except Exception as e:
        logger.error(f"[publish_worker] Fatal error in process_due_posts: {e}", exc_info=True)


# ---------------------------------------------------------------------------
# Per-post publish logic
# ---------------------------------------------------------------------------

async def _publish_single_post(post: Dict[str, Any]) -> None:
    """
    Attempt to publish a single scheduled post.
    Updates status to 'posted' or 'failed' regardless of outcome.
    """
    post_id: str = post["id"]
    brand_id: str = post.get("brand_id", "")
    platform: str = post.get("platform", "").lower()

    logger.info(
        f"[publish_worker] posting post {post_id} | brand={brand_id} | platform={platform}"
    )

    # Lock the row immediately so parallel worker runs don't double-publish
    _mark_in_progress(post_id)

    try:
        if platform == "tiktok":
            await _publish_tiktok(post_id, brand_id)
        else:
            raise NotImplementedError(f"Platform '{platform}' is not supported by publish_worker")

        now = datetime.now(timezone.utc).isoformat()
        update_post(post_id, {"status": "posted", "posted_time": now})
        logger.info(f"[publish_worker] Post {post_id} posted successfully")

    except Exception as e:
        logger.error(f"[publish_worker] Failed to publish post {post_id}: {e}", exc_info=True)
        update_post(post_id, {"status": "failed", "metadata": {"publish_error": str(e)}})


async def _publish_tiktok(post_id: str, brand_id: str) -> None:
    """Delegate to the existing TikTok publisher."""
    from services.integrations.social.tiktok.social_account import publish_post

    await publish_post(
        brand_id=brand_id,
        platforms=["tiktok"],
        post_id=post_id,
    )


# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------

def _fetch_due_posts(now: str) -> List[Dict[str, Any]]:
    """
    Return posts that are scheduled and whose scheduled_time has arrived.
    Uses a 'posting' status guard to prevent double-processing.
    """
    try:
        response = (
            _get_supabase()
            .table("posts")
            .select("id, brand_id, platform, scheduled_time")
            .eq("status", "scheduled")
            .lte("scheduled_time", now)
            .limit(BATCH_SIZE)
            .execute()
        )
        return response.data or []
    except Exception as e:
        logger.error(f"[publish_worker] Error fetching due posts: {e}", exc_info=True)
        return []


def _mark_in_progress(post_id: str) -> None:
    """
    Set status to 'posting' so a second worker invocation skips this post.
    This is a best-effort lock — not a DB-level FOR UPDATE.
    """
    try:
        _get_supabase().table("posts").update({"status": "posting"}).eq("id", post_id).execute()
    except Exception as e:
        logger.warning(f"[publish_worker] Could not mark post {post_id} as posting: {e}")
