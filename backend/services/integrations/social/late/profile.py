import requests
from config import Config

# Create a new profile in Late
async def create_late_profile(profile_name: str, profile_description: str) -> str:
  
  response = requests.post(
      'https://getlate.dev/api/v1/profiles',
      headers={'Authorization': f'Bearer {Config.LATE_API_KEY}'},
      json={
          'name': profile_name,
          'description': profile_description
      }
  ) 

  profile = response.json()
  print(f"Profile created: {profile['_id']}")
  
  return profile['_id']  # Return the profile ID to be saved