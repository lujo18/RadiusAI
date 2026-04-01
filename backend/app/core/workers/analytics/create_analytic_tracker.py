from datetime import datetime, timedelta, timezone

from app.features.integrations.supabase.client import get_supabase


async def create_analytic_tracker(post_id: str):
    """
    Initialize analytics tracking for a newly published post.
    Creates a record in post_tracking_metadata to schedule periodic collection.

    Args:
        post_id: The Supabase post ID to track
    """
    supabase = get_supabase()

    now = datetime.now(timezone.utc)
    first_run = now + timedelta(hours=1)  # start with hourly interval

    (
        supabase.table("post_tracking_metadata")
        .upsert(
            {
                "post_id": post_id,
                "last_collected_at": None,
                "next_collection_at": first_run.isoformat(),
                "current_interval": "hourly",
                "collection_count": 0,
            },
            on_conflict="post_id",
        )
        .execute()
    )
