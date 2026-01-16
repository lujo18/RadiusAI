import requests
from typing import Optional
from backend.config import Config


def connect_social(late_profile_id: str, social_platform: str) -> Optional[str]:
  """
  Connect a social media account using Late API.
  
  Args:
    social_platform: Platform name (e.g., 'twitter', 'instagram', 'linkedin')
    profile_id: Late profile ID
    
  Returns:
    Authorization URL string or None if request fails
  """
  api_key = Config.LATE_API_KEY
  

  if not api_key:
    raise ValueError("LATE_API_KEY environment variable is not set")
  
  try:
    response = requests.get(
      f'https://getlate.dev/api/v1/connect/{social_platform}',
      params={'profileId': late_profile_id},
      headers={'Authorization': f'Bearer {api_key}'},
      timeout=10
    )
        
    response.raise_for_status()
    
    auth_url = response.json().get('authUrl')
    return auth_url
    
  except Exception as e:
    print(f"Error connecting {social_platform}: {e}")
    return None