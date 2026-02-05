from fastapi import APIRouter, Request, HTTPException
from datetime import datetime
import logging

from services.integrations.supabase.db.post import (
    update_post_status,
    get_post_by_external_id,
)
from services.workers.analytics.create_analytic_tracker import create_analytic_tracker

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])
logger = logging.getLogger(__name__)


demo = {
    "event_type": "social.post.updated",
    "data": {
        "id": "sp_Rt13rLpZlChfDjTc986aR",
        "media": [
            {
                "url": "https://klwznwkionqlkxrqakke.supabase.co/storage/v1/object/public/slides/a29c6bc4-ced4-4c10-92f9-99bc3cf468c8/172bfbf4-2d5a-4bee-b6bb-87d974d154a1/slide-0.png?",
                "tags": None,
                "thumbnail_url": None,
                "thumbnail_timestamp_ms": None,
            },
            {
                "url": "https://klwznwkionqlkxrqakke.supabase.co/storage/v1/object/public/slides/a29c6bc4-ced4-4c10-92f9-99bc3cf468c8/172bfbf4-2d5a-4bee-b6bb-87d974d154a1/slide-1.png?",
                "tags": None,
                "thumbnail_url": None,
                "thumbnail_timestamp_ms": None,
            },
            {
                "url": "https://klwznwkionqlkxrqakke.supabase.co/storage/v1/object/public/slides/a29c6bc4-ced4-4c10-92f9-99bc3cf468c8/172bfbf4-2d5a-4bee-b6bb-87d974d154a1/slide-2.png?",
                "tags": None,
                "thumbnail_url": None,
                "thumbnail_timestamp_ms": None,
            },
            {
                "url": "https://klwznwkionqlkxrqakke.supabase.co/storage/v1/object/public/slides/a29c6bc4-ced4-4c10-92f9-99bc3cf468c8/172bfbf4-2d5a-4bee-b6bb-87d974d154a1/slide-3.png?",
                "tags": None,
                "thumbnail_url": None,
                "thumbnail_timestamp_ms": None,
            },
            {
                "url": "https://klwznwkionqlkxrqakke.supabase.co/storage/v1/object/public/slides/a29c6bc4-ced4-4c10-92f9-99bc3cf468c8/172bfbf4-2d5a-4bee-b6bb-87d974d154a1/slide-4.png?",
                "tags": None,
                "thumbnail_url": None,
                "thumbnail_timestamp_ms": None,
            },
            {
                "url": "https://klwznwkionqlkxrqakke.supabase.co/storage/v1/object/public/slides/a29c6bc4-ced4-4c10-92f9-99bc3cf468c8/172bfbf4-2d5a-4bee-b6bb-87d974d154a1/slide-5.png?",
                "tags": None,
                "thumbnail_url": None,
                "thumbnail_timestamp_ms": None,
            },
        ],
        "status": "processed",
        "caption": "Boost your relationships with these 5 simple communication steps. Start with Step 1 today and follow for more practical tips!",
        "created_at": "2026-02-04T18:03:06.183344+00:00",
        "updated_at": "2026-02-04T18:03:06.183344+00:00",
        "external_id": None,
        "scheduled_at": "2026-02-04T18:03:06.183344+00:00",
        "social_accounts": [
            {
                "id": "spc_l5JzkyoKzmVaSXZqoJds",
                "user_id": "-000frL1ppW41tVfDtBgjy5J33H_gxb2nNmF",
                "platform": "tiktok",
                "username": "scriptedsocial",
                "external_id": "51cc61f9-5958-4c41-8e7e-245192d431fa",
                "access_token": "act.jfR0jaAmoav7IyJzSlMv2qX7QAvnaIcYdTNZkFpsDE1Mb1DnzM7a34feNPbN!6381.u1",
                "refresh_token": "rft.IZawnH5kmTxhnZxUYy1q4kh8gfjOBBumHbRjtyWbKrsJx3ocw9wMtYF6NMYE!6429.u1",
                "access_token_expires_at": "2026-02-03T18:03:37.535+00:00",
                "refresh_token_expires_at": "2027-01-31T05:29:15.906+00:00",
            }
        ],
        "account_configurations": [],
        "platform_configurations": {
            "tiktok": {
                "media": [],
                "title": "Boost your relationships with these 5 simple communication steps. Start with Step 1 today and follow for more practical tips!",
                "caption": "Boost your relationships with these 5 simple communication steps. Start with Step 1 today and follow for more practical tips! #communicationtips #psychology #relationshiptips #selfimprovement #publicspeaking",
                "is_draft": False,
                "allow_duet": True,
                "allow_stitch": True,
                "allow_comment": True,
                "privacy_status": "public",
                "is_ai_generated": False,
                "disclose_your_brand": False,
                "disclose_branded_content": False,
            }
        },
    },
}


@router.post("/postforme/post")
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

    event = body.get("event_type")
    data = body.get("data")

    print("Webhook Payload", body)

    if not event or not data:
        raise HTTPException(status_code=400, detail="Missing event or data")

    # Optional: verify signature if PostForMe adds one later
    # signature = request.headers.get("X-PostForMe-Signature")
    # if not verify_signature(signature, body):
    #     raise HTTPException(status_code=401, detail="Invalid signature")

    try:
        if event == "social.post.updated" and data.get("status") == "processed":
            await handle_post_published(data)
        elif event == "social.post.failed":
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
    published_at = data.get("created_at")

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
        update_post_status(post_id=post_id, status="posted", published_at=published_at)

        logger.info(f"Post {post_id} marked as published on {platform}")

        # Queue analytics tracking
        await create_analytic_tracker(post_id)
        logger.info(f"Analytics tracker created for post {post_id}")

    except Exception as e:
        logger.error(
            f"Failed to handle post published event for external_post_id {external_post_id}: {e}"
        )
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
        update_post_status(post_id=post_id, status="failed", error_message=error)

        logger.error(f"Post {post_id} failed on {platform}: {error}")

    except Exception as e:
        logger.error(f"Failed to update post {post_id} status: {e}")
        raise
