
from app.features.integrations.supabase.client import get_supabase


def get_template_count(brand_id: str) -> int:
  supabase = get_supabase()
  
  response = (
    supabase
    .table("templates")
    .select("*")
    .eq("brand_id", brand_id)
    .execute()
  )
  
  count = len(response.data)
  

  return count