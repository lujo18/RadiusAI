from typing import Optional
from backend.features.error.helper import api_error
from services.integrations.supabase.client import get_supabase


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
        msg = str(e)
        if 'PGRST116' in msg or 'Cannot coerce' in msg:
            return None
        api_error(500, "DB_ERROR", f"Error fetching CTA {cta_id}: {msg}")
