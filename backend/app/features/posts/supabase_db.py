"""
Post Supabase Database Utilities
Post CRUD operations for Supabase.
Mirrors frontend PostRepository pattern.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime

from app.features.integrations.supabase.client import get_supabase
from app.core.workers.analytics import create_analytic_tracker


# ==================== READ OPERATIONS ====================


def get_post(post_id: str) -> Optional[Dict[str, Any]]:
    """Get a single post by ID."""
    supabase = get_supabase()
    response = supabase.from_("posts").select("*").eq("id", post_id).single().execute()

    print("got post in post.py")

    if not response.data:
        return None

    return response.data


def get_post_by_external_id(external_post_id: str) -> Optional[Dict[str, Any]]:
    """Get a post by external_post_id (from PostForMe webhook)."""
    supabase = get_supabase()
    try:
        response = (
            supabase.from_("posts")
            .select("*")
            .eq("external_post_id", external_post_id)
            .single()
            .execute()
        )
    except Exception as e:
        msg = str(e)
        if (
            "Cannot coerce the result to a single JSON object" in msg
            or "PGRST116" in msg
        ):
            return None
        raise

    if not response.data:
        return None

    return response.data


def get_posts(brand_id: str) -> List[Dict[str, Any]]:
    """Get all posts for a brand, ordered by creation date (newest first)."""
    supabase = get_supabase()
    response = (
        supabase.from_("posts")
        .select("*")
        .eq("brand_id", brand_id)
        .order("created_at", desc=True)
        .execute()
    )

    return response.data or []


def get_posts_by_status(brand_id: str, status: str) -> List[Dict[str, Any]]:
    """Get posts by brand and status."""
    supabase = get_supabase()
    response = (
        supabase.from_("posts")
        .select("*")
        .eq("brand_id", brand_id)
        .eq("status", status)
        .order("created_at", desc=True)
        .execute()
    )

    return response.data or []


def get_posts_by_template(brand_id: str, template_id: str) -> List[Dict[str, Any]]:
    """Get all posts created from a specific template for a brand."""
    supabase = get_supabase()
    response = (
        supabase.from_("posts")
        .select("*")
        .eq("brand_id", brand_id)
        .eq("template_id", template_id)
        .order("created_at", desc=True)
        .execute()
    )

    return response.data or []


def get_scheduled_posts(brand_id: str) -> List[Dict[str, Any]]:
    """Get all scheduled posts for a brand, ordered by scheduled time (earliest first)."""
    supabase = get_supabase()
    response = (
        supabase.from_("posts")
        .select("*")
        .eq("brand_id", brand_id)
        .eq("status", "scheduled")
        .order("scheduled_time", desc=False)
        .execute()
    )

    return response.data or []


def get_posts_by_variant_set(
    brand_id: str, variant_set_id: str
) -> List[Dict[str, Any]]:
    """Get all posts in a variant set (for A/B testing) for a brand."""
    supabase = get_supabase()
    response = (
        supabase.from_("posts")
        .select("*")
        .eq("brand_id", brand_id)
        .eq("variant_set_id", variant_set_id)
        .order("created_at", desc=True)
        .execute()
    )

    return response.data or []


# ==================== CREATE OPERATIONS ====================


def create_post(
    brand_id: str,
    template_id: str,
    platform: str = "tiktok",
    content: Dict[str, Any] = None,
    status: str = "draft",
    scheduled_time: Optional[str] = None,
    variant_set_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Create a new post."""
    supabase = get_supabase()

    post_data = {
        "brand_id": brand_id,
        "platform": platform,
        "status": status,
        "content": content,
        "created_at": datetime.now().isoformat(),
        "storage_urls": {"slides": [], "thumbnail": None},
        "metadata": metadata or {},
    }

    if template_id:
        post_data["template_id"] = template_id

    if scheduled_time:
        post_data["scheduled_time"] = scheduled_time

    if variant_set_id:
        post_data["variant_set_id"] = variant_set_id

    response = supabase.from_("posts").insert([post_data]).execute()

    if not response.data:
        raise Exception("Failed to create post")

    return response.data[0]


# ==================== UPDATE OPERATIONS ====================


def update_post(post_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    """Update post fields."""
    supabase = get_supabase()

    updates["updated_at"] = datetime.now().isoformat()

    response = supabase.from_("posts").update(updates).eq("id", post_id).execute()

    if not response.data:
        raise Exception(f"Failed to update post {post_id}")

    return response.data[0]


def update_post_status(
    post_id: str,
    status: str,
    published_at: Optional[str] = None,
    social_post_id: Optional[str] = None,
    error_message: Optional[str] = None,
) -> bool:
    """Update post status with optional webhook data."""
    import asyncio

    supabase = get_supabase()

    update_data = {"status": status, "updated_at": datetime.now().isoformat()}

    if status == "posted":
        update_data["published_time"] = published_at or datetime.now().isoformat()
        if social_post_id:
            update_data["external_post_id"] = social_post_id

    if status == "failed" and error_message:
        update_data["error_message"] = error_message

    response = supabase.from_("posts").update(update_data).eq("id", post_id).execute()

    # If post is now published, start analytics tracking
    if status == "published":
        try:
            asyncio.run(create_analytic_tracker(post_id))
        except Exception as e:
            print(
                f"Warning: Failed to start analytics tracking for post {post_id}: {e}"
            )

    return True


def update_post_storage_urls(
    post_id: str, slide_urls: List[str] = None, thumbnail_url: Optional[str] = None
) -> dict:
    """Update storage URLs for post slides and thumbnail."""
    supabase = get_supabase()

    storage_urls = {"slides": slide_urls or [], "thumbnail": thumbnail_url}

    response = (
        supabase.from_("posts")
        .update(
            {"storage_urls": storage_urls, "updated_at": datetime.now().isoformat()}
        )
        .eq("id", post_id)
        .execute()
    )

    if response.data and len(response.data) > 0:
        return response.data[0]

    fetch_response = (
        supabase.from_("posts").select("*").eq("id", post_id).single().execute()
    )

    return fetch_response.data if fetch_response.data else {}


def update_post_content(post_id: str, content: Dict[str, Any]) -> Dict[str, Any]:
    """Update post content (slides, caption, etc.)."""
    return update_post(post_id=post_id, updates={"content": content})


def update_post_metadata(post_id: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
    """Update post metadata (variant_label, generation_params, etc.)."""
    return update_post(post_id=post_id, updates={"metadata": metadata})


# ==================== DELETE OPERATIONS ====================


def delete_post(post_id: str) -> bool:
    """Delete a post."""
    supabase = get_supabase()
    supabase.from_("posts").delete().eq("id", post_id).execute()
    return True


# ==================== HELPER FUNCTIONS ====================


def get_post_content(post: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Extract content from post dict."""
    return post.get("content")


def get_storage_urls(post: Dict[str, Any]) -> Dict[str, List[str]]:
    """Extract storage URLs from post dict."""
    urls = post.get("storage_urls", {})
    return {"slides": urls.get("slides", []), "thumbnail": urls.get("thumbnail")}


def get_post_metadata(post: Dict[str, Any]) -> Dict[str, Any]:
    """Extract metadata from post dict."""
    metadata = post.get("metadata", {})
    return {
        "variant_label": metadata.get("variant_label"),
        "generation_params": metadata.get("generation_params", {}),
    }


def get_slide_count(post: Dict[str, Any]) -> int:
    """Get number of slides in post content."""
    content = get_post_content(post)
    if not content:
        return 0

    slides = content.get("slides", [])
    return len(slides)


def is_post_published(post: Dict[str, Any]) -> bool:
    """Check if post has been published."""
    return post.get("status") == "published"
