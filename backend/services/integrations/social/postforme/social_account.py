import httpx

from backend.config import Config
from ..social_provider import CreateAuthUrlResponse

POST_FOR_ME_API_KEY = Config.POST_FOR_ME_API_KEY


async def create_auth_url(platform: str, external_id: str = "") -> CreateAuthUrlResponse:
  """
  Generate an authentication URL for a given social platform using PostForMe API.
  This URL is used to redirect the user to the platform's OAuth login page.

  Args:
    platform (str): The social platform to connect (e.g., 'instagram', 'tiktok').
    external_id (str, optional): An external identifier for the user/account (if available).

  Returns:
    str: The authentication URL to redirect the user for OAuth.
  """
  
  payload = {
    "platform": platform,
    "external_id": external_id,
    "permissions": ["posts", "feeds"],  # optional
  }
  
  async with httpx.AsyncClient(timeout=30.0) as client:
    r = await client.post(
      "https://api.postforme.dev/v1/social-accounts/auth-url",
      json=payload,
      headers={"Authorization": f"Bearer {POST_FOR_ME_API_KEY}"}
    )
    r.raise_for_status()
  
    url = r.json()["url"]
  
    return CreateAuthUrlResponse(
      authUrl=url,
      platform=platform,
      message=f"Redirect user to authUrl to authorize {platform} access",
    )
    

#  Create an auth URL to redirect the user to in order for them to login and connect their account
async def exchange_code(code: str, platform: str):
  """
  Exchange an OAuth code for a social account connection using PostForMe API.
  This function completes the OAuth flow and returns the connected account details.

  Args:
    code (str): The OAuth code or access token returned by the platform after user login.
    platform (str): The social platform being connected.

  Returns:
    dict: The connected social account details as returned by PostForMe.
  """
  
  async with httpx.AsyncClient(timeout=30.0) as client:
    r = await client.post(
      "https://api.postforme.dev/v1/social-accounts",
      json={
        "platform": platform,
        "access_token": code,  # PostForMe uses this "code" to finish OAuth
        "access_token_expires_at": "2099-01-01T00:00:00Z",  # placeholder
        "user_id": "",  # PostForMe will overwrite this
      },
      headers={"Authorization": f"Bearer {POST_FOR_ME_API_KEY}"}
    )
    
    r.raise_for_status()
    return r.json()

