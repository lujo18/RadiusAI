from datetime import datetime
from typing import Any, Optional

from app.features.integrations.supabase.client import get_supabase


class BlogRepository:
    def __init__(self):
        self.supabase = get_supabase()

    def list_published(self, limit: int = 50) -> list[dict[str, Any]]:
        response = (
            self.supabase.from_("blog_posts")
            .select("*")
            .eq("is_published", True)
            .order("published_at", desc=True)
            .limit(limit)
            .execute()
        )
        return response.data or []

    def list_all(self, limit: int = 200) -> list[dict[str, Any]]:
        response = (
            self.supabase.from_("blog_posts")
            .select("*")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return response.data or []

    def get_by_slug(self, slug: str, published_only: bool = False) -> Optional[dict[str, Any]]:
        query = self.supabase.from_("blog_posts").select("*").eq("slug", slug)
        if published_only:
            query = query.eq("is_published", True)

        try:
            response = query.single().execute()
        except Exception as exc:
            msg = str(exc)
            if "PGRST116" in msg or "single JSON object" in msg:
                return None
            raise

        return response.data

    def create(self, payload: dict[str, Any]) -> dict[str, Any]:
        payload = {
            **payload,
            "created_at": payload.get("created_at") or datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }

        response = self.supabase.from_("blog_posts").insert([payload]).execute()
        if not response.data:
            raise ValueError("Failed to create blog post")

        return response.data[0]

    def update(self, post_id: str, updates: dict[str, Any]) -> dict[str, Any]:
        payload = {
            **updates,
            "updated_at": datetime.utcnow().isoformat(),
        }
        response = (
            self.supabase.from_("blog_posts")
            .update(payload)
            .eq("id", post_id)
            .execute()
        )
        if not response.data:
            raise ValueError(f"Failed to update blog post {post_id}")
        return response.data[0]
