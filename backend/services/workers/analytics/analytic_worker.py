import asyncio
import logging
from datetime import datetime, timezone

from backend.services.integrations.supabase.client import get_supabase
from backend.services.integrations.social.postforme.analytics_client import (
    get_postforme_analytics_client,
)

from .pick_interval import pick_interval

BATCH_SIZE = 50

logger = logging.getLogger(__name__)
supabase = get_supabase()
postforme_client = get_postforme_analytics_client()


async def fetch_platform_metrics(post_id: str) -> dict:
    """
    Call PostForMe API to fetch analytics for a specific post.
    
    Args:
        post_id: Internal Supabase post ID
    
    Returns:
        dict with metrics from PostForMe, or empty dict if error
    """
    # 1) Get the post from Supabase to find pfm_post_id (stored as external_post_id)
    try:
        post_response = supabase.table("posts").select("external_post_id, platform").eq("id", post_id).single().execute()
        
        if not post_response.data:
            logger.warning(f"Post {post_id} not found in Supabase")
            return {}
        
        post = post_response.data
        pfm_post_id = post.get("external_post_id")
        platform = post.get("platform", "").lower()
        
        if not pfm_post_id:
            logger.warning(f"Post {post_id} has no external_post_id (pfm_post_id)")
            return {}
        
        # 2) Call PostForMe API with the social_post_id
        # Using external_post_id as the social_post_id for PostForMe queries
        analytics_response = await postforme_client.get_post_analytics(
            social_post_id=pfm_post_id,
            limit=1,
            expand=["metrics"]
        )
        
        if not analytics_response or not analytics_response.data:
            logger.warning(f"No analytics data from PostForMe for post {post_id}")
            return {}
        
        # 3) Extract metrics from first item (limit=1)
        item = analytics_response.data[0]
        
        if not item.metrics:
            logger.warning(f"No metrics in PostForMe response for post {post_id}")
            return {}
        
        # 4) Map PostForMe metrics to our schema
        metrics_dict = item.metrics.dict()
        
        return {
            "likes": metrics_dict.get("likes", 0),
            "comments": metrics_dict.get("comments", 0),
            "shares": metrics_dict.get("shares", 0),
            "saves": metrics_dict.get("favorites", 0),  # PostForMe uses 'favorites' for saves
            "impressions": metrics_dict.get("reach", 0),
            "last_updated": datetime.now(timezone.utc).isoformat(),
        }
    
    except Exception as e:
        logger.error(f"Error fetching metrics for post {post_id}: {e}")
        return {}


async def process_due_posts():
    """
    Main worker function: find posts due for analytics collection and process them.
    Called periodically by the cron scheduler (every 5 minutes).
    """
    try:
        now = datetime.now(timezone.utc).isoformat()
        
        logger.info(f"Starting analytics worker at {now}")

        # 1) Get tracking rows that are due for collection
        due = (
            supabase.table("post_tracking_metadata")
            .select("post_id, current_interval, collection_count, last_collected_at")
            .lte("next_collection_at", now)
            .limit(BATCH_SIZE)
            .execute()
        )

        if not due.data:
            logger.info("No posts due for analytics collection")
            return

        logger.info(f"Found {len(due.data)} posts due for collection")
        
        post_ids = [row["post_id"] for row in due.data]

        # 2) Get basic post info (for age, user, platform, etc.)
        posts = (
            supabase.table("posts")
            .select("id, user_id, published_time, platform, brand_id")
            .in_("id", post_ids)
            .execute()
        )

        posts_by_id = {p["id"]: p for p in posts.data}

        # 3) Process each post concurrently
        tasks = []
        for row in due.data:
            p = posts_by_id.get(row["post_id"])
            if not p:
                logger.warning(f"Post {row['post_id']} not found in posts table")
                continue
            tasks.append(process_single_post(row, p))

        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Log any exceptions that occurred
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Error processing post {post_ids[i]}: {result}")
        
        logger.info(f"Completed analytics collection for {len(results)} posts")

    except Exception as e:
        logger.error(f"Error in process_due_posts: {e}")


async def process_single_post(track_row: dict, post_row: dict):
    """
    Process analytics collection for a single post:
    1. Fetch metrics from PostForMe
    2. Store in post_analytics table
    3. Update next collection time based on post age
    
    Args:
        track_row: Row from post_tracking_metadata
        post_row: Row from posts table
    """
    post_id = track_row["post_id"]
    user_id = post_row["user_id"]
    brand_id = post_row.get("brand_id")
    platform = post_row.get("platform", "")
    
    # Use published_time if available, else created_at
    published_time_str = post_row.get("published_time")
    if published_time_str:
        posted_at = datetime.fromisoformat(published_time_str.replace("Z", "+00:00"))
    else:
        # Fallback: use current time (post just created)
        posted_at = datetime.now(timezone.utc)
    
    now = datetime.now(timezone.utc)

    try:
        # 1) Fetch metrics from PostForMe API
        metrics = await fetch_platform_metrics(post_id)
        
        if not metrics:
            logger.warning(f"No metrics fetched for post {post_id}, skipping analytics update")
            return

        # 2) Calculate engagement rate (if possible)
        engagement_rate = None
        if metrics.get("impressions", 0) > 0:
            total_engagement = (
                metrics.get("likes", 0)
                + metrics.get("comments", 0)
                + metrics.get("shares", 0)
                + metrics.get("saves", 0)
            )
            engagement_rate = total_engagement / metrics["impressions"]

        # 3) Upsert analytics (update if exists, insert if new)
        analytics_record = {
            "post_id": post_id,
            "likes": metrics.get("likes", 0),
            "comments": metrics.get("comments", 0),
            "shares": metrics.get("shares", 0),
            "saves": metrics.get("saves", 0),
            "impressions": metrics.get("impressions", 0),
            "engagement_rate": engagement_rate,
            "last_updated": now.isoformat(),
        }
        
        # Upsert: update if post_analytics already exists for this post, else insert
        supabase.table("post_analytics").upsert(
            analytics_record,
            on_conflict="post_id"
        ).execute()
        
        logger.info(f"Updated analytics for post {post_id}")

        # 4) Compute next collection interval based on post age
        age_hours = (now - posted_at).total_seconds() / 3600
        interval = pick_interval(age_hours)
        
        if interval is None:
            # Post is too old, stop tracking
            logger.info(f"Post {post_id} is too old ({age_hours:.1f}h), stopping tracking")
            return

        # 5) Update tracking metadata for next collection
        next_collection_time = now + interval.delta
        
        supabase.table("post_tracking_metadata").update({
            "last_collected_at": now.isoformat(),
            "next_collection_at": next_collection_time.isoformat(),
            "current_interval": interval.key,
            "collection_count": track_row["collection_count"] + 1,
        }).eq("post_id", post_id).execute()
        
        logger.info(
            f"Updated tracking for post {post_id}: "
            f"next collection in {interval.key} ({interval.delta})"
        )

    except Exception as e:
        logger.error(f"Error processing post {post_id}: {e}", exc_info=True)
