from backend.main import supabase
from datetime import datetime

from backend.models.user import BrandSettings

def create_supabase_profile(user_id: str, late_profile_id: str, profile_name: str, profile_description: str, brand_settings: BrandSettings):
  res = supabase.table('profiles').insert({
      'user_id': user_id,
      'late_profile_id': late_profile_id,
      'name': profile_name,
      'description': profile_description,
      'created_at': datetime.timestamp(datetime.now()),
      'brand_settings': brand_settings.dict()
  }).execute()

  print(f"Profile created in Supabase: {res.data[0]['late_profile_id']}")
  
  return res.data[0]  # Return the profile