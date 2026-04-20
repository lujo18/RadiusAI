import logging

from fastapi import Depends, HTTPException

from app.core.security import get_current_user
from app.features.integrations.supabase.client import get_supabase

logger = logging.getLogger(__name__)


def get_current_admin_user(user_id: str = Depends(get_current_user)) -> str:
    """Require an authenticated user who is marked as admin in public.users."""
    supabase = get_supabase()

    try:
        response = (
            supabase.from_("users")
            .select("is_admin")
            .eq("id", user_id)
            .single()
            .execute()
        )
        row = response.data or {}
    except Exception as exc:
        logger.warning("Admin authorization check failed for %s: %s", user_id, exc)
        raise HTTPException(status_code=403, detail="Admin access required")

    if not bool(row.get("is_admin")):
        raise HTTPException(status_code=403, detail="Admin access required")

    return user_id
