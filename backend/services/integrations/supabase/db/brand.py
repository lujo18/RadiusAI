from datetime import datetime

from backend.models.user import BrandSettings
from backend.services.integrations.supabase.client import get_supabase

def create_supabase_brand(user_id: str, late_profile_id: str, brand_name: str, brand_description: str, brand_settings: BrandSettings):
    supabase = get_supabase()
    res = supabase.table('profiles').insert({
      'user_id': user_id,
      'late_profile_id': late_profile_id,
      'name': brand_name,
      'description': brand_description,
      'created_at': datetime.now().isoformat(),
      'brand_settings': brand_settings.dict() if hasattr(brand_settings, 'dict') else brand_settings
    }).execute()

    print(f"Profile created in Supabase: {res.data[0]['late_profile_id']}")
    return res.data[0]  # Return the profile
  
  
def connect_social_account_to_brand(user_id: str, brand_id: str, platform: str, late_account_id: str, username: str):
  """
  Connects a social media account integration to a profile in Supabase.

  Args:
    user_id (str): The user who owns account
    brand_id (str): The profile's late_profile_id.
    platform (str): The social media platform (e.g., 'instagram', 'tiktok').
    late_account_id (str): The social account's unique ID.
    access_token (str): OAuth access token.
    refresh_token (str, optional): OAuth refresh token.
    expires_at (datetime, optional): Token expiration time.
  """
  supabase = get_supabase()
  
  data = {
    'user_id': user_id,
    'brand_id': brand_id,
    'platform': platform,
    'late_account_id': late_account_id,
    'username': username
  }

  res = supabase.table('platform_integrations').insert(data).execute()
  print(f"Connected {platform} account {late_account_id} to profile {brand_id}")
  return res.data[0] if res.data else None