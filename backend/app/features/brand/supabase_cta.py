"""
Brand CTA Supabase Database Utilities
CTA (Call-To-Action) management for brands.
"""

from typing import Optional
from app.features.integrations.supabase.client import get_supabase


def get_brand_cta(cta_id: str) -> Optional[dict]:
    """
    Fetch a CTA from the database by ID.

    Args:
        cta_id (str): The CTA ID to fetch

    Returns:
        dict: The CTA record if found, None otherwise
    """
    supabase = get_supabase()

    try:
        res = (
            supabase.table("brand_ctas")
            .select("*")
            .eq("id", cta_id)
            .eq("is_deleted", False)
            .single()
            .execute()
        )

        if res.data:
            return res.data

        return None
    except Exception as e:
        print(f"Error fetching CTA {cta_id}: {str(e)}")
        return None
