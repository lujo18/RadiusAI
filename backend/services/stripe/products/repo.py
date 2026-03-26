
from typing import Any, Dict, Optional

from app.features.integrations.supabase.client import get_supabase


def get_all_product_rate_limits() -> Optional[list]:
    """Return all rows from `product_rate_limits` table or None if not available."""
    supabase = get_supabase()
    try:
        res = supabase.table("product_rate_limits").select("*").execute()
        if getattr(res, "error", None) or not getattr(res, "data", None):
            return []
        return res.data
    except Exception as e:
        print("get_all_product_rate_limits failed", e)
        return []


def get_product_rate_limit(product_id: str) -> Optional[Dict[str, Any]]:
    """Read product rate limit configuration from `product_rate_limits` table if present.

    If the table or row does not exist, return None to indicate no enforced limit.
    """
    supabase = get_supabase()
    try:
        res = supabase.table("product_rate_limits").select("*").eq("product_id", product_id).limit(1).execute()
        if getattr(res, "error", None) or not getattr(res, "data", None):
            return None
        return res.data[0]
    except Exception as e:
        # Table might not exist; treat as no limits configured
        print("product_rate_limits read failed", e)
        return None