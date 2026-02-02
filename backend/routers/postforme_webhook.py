from fastapi import APIRouter, Request, HTTPException
from datetime import datetime
import logging

from backend.services.integrations.supabase.db.post import update_post_status, get_post_by_external_id
from backend.services.workers.analytics import create_analytic_tracker

router = APIRouter(prefix="/webhooks", tags=["webhooks"])
logger = logging.getLogger(__name__)


@router.post("/postforme/webhook")
async def postforme_webhook(request: Request):
    """
    Handle PostForMe webhook events for published posts.
    
    Events:
    - post.published: Post was successfully published to social media
    - post.failed: Post failed to publish
    """
    try:
        body = await request.json()
    except Exception as e:
        logger.error(f"Failed to parse webhook body: {e}")
        raise HTTPException(status_code=400, detail="Invalid request body")

    event = body.get("event")
    data = body.get("data")

    if not event or not data:
        raise HTTPException(status_code=400, detail="Missing event or data")

    # Optional: verify signature if PostForMe adds one later
    # signature = request.headers.get("X-PostForMe-Signature")
    # if not verify_signature(signature, body):
    #     raise HTTPException(status_code=401, detail="Invalid signature")

    try:
        if event == "post.published":
            await handle_post_published(data)
        elif event == "post.failed":
            await handle_post_failed(data)
        else:
            logger.warning(f"Unknown event type: {event}")

        return {"received": True, "event": event}

    except Exception as e:
        logger.error(f"Error processing webhook event {event}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


async def handle_post_published(data: dict):
    """
    Handle post.published event from PostForMe.
    
    Args:
        data: {
            "id": "external_post_id",
            "platform": "instagram" | "tiktok",
            "published_at": "2026-01-30T12:00:00Z",
            "social_post_id": "optional_instagram_post_id"
        }
    """
    external_post_id = data.get("id")
    platform = data.get("platform")
    published_at = data.get("published_at")
    social_post_id = data.get("social_post_id")

    if not external_post_id:
        logger.error("Missing external post_id in webhook data")
        return

    try:
        # Look up Supabase post using external_post_id
        post = get_post_by_external_id(external_post_id)
        
        if not post:
            logger.error(f"Post not found for external_post_id: {external_post_id}")
            return
        
        post_id = post["id"]
        
        # Update post status to published
        await update_post_status(
            post_id=post_id,
            status="published",
            published_at=published_at,
            social_post_id=social_post_id
        )

        logger.info(f"Post {post_id} marked as published on {platform}")

        # Queue analytics tracking
        await create_analytic_tracker(post_id)
        logger.info(f"Analytics tracker created for post {post_id}")

    except Exception as e:
        logger.error(f"Failed to handle post published event for external_post_id {external_post_id}: {e}")
        raise


async def handle_post_failed(data: dict):
    """
    Handle post.failed event from PostForMe.
    
    Args:
        data: {
            "id": "post_id",
            "platform": "instagram" | "tiktok",
            "error": "error_message"
        }
    """
    post_id = data.get("id")
    platform = data.get("platform")
    error = data.get("error", "Unknown error")

    if not post_id:
        logger.error("Missing post_id in webhook data")
        return

    try:
        # Update post status to failed
        await update_post_status(
            post_id=post_id,
            status="failed",
            error_message=error
        )

        logger.error(f"Post {post_id} failed on {platform}: {error}")

    except Exception as e:
        logger.error(f"Failed to update post {post_id} status: {e}")
        raise
