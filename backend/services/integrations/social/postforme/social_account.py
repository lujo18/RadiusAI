import httpx

from backend.config import Config
from ..social_provider import CreateAuthUrlResponse, SaveIntegrationResponse
from backend.services.integrations.supabase.db.brand import (
    connect_social_account_to_brand,
    update_social_account_status
)

POST_FOR_ME_API_KEY = Config.POST_FOR_ME_API_KEY


async def create_auth_url(platform: str, external_id: str) -> CreateAuthUrlResponse:
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
            headers={"Authorization": f"Bearer {POST_FOR_ME_API_KEY}"},
        )
        r.raise_for_status()

        url = r.json()["url"]

        return CreateAuthUrlResponse(
            authUrl=url,
            platform=platform,
            message=f"Redirect user to authUrl to authorize {platform} access",
        )


#  Create an auth URL to redirect the user to in order for them to login and connect their account
async def save_integration(response: dict):
    """
    Exchange an OAuth code for a social account connection using PostForMe API.
    This function completes the OAuth flow and returns the connected account details.

    Args:
      code (str): The OAuth code or access token returned by the platform after user login.
      platform (str): The social platform being connected.

    Returns:
      dict: The connected social account details as returned by PostForMe.
    """
    # connected = response.connected
    # project_id = request.query_params.get("projectId")
    account_ids = response["accountIds"]
    # provider = request.query_params.get("provider")

    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(
            f"https://api.postforme.dev/v1/social-accounts/{account_ids}",
            headers={"Authorization": f"Bearer {POST_FOR_ME_API_KEY}"},
        )

        r.raise_for_status()

        profile_data = dict(r.json())

        print("Profile res", profile_data)
        print("External Id", profile_data["external_id"])

        try:
            connect_social_account_to_brand(
                brand_id=profile_data["external_id"],
                platform=profile_data["platform"],
                post_for_me_account_id=profile_data["id"],
                username=profile_data["username"],
                profile_picture_url=profile_data["profile_photo_url"],
            )

            return SaveIntegrationResponse(
                brand_id=profile_data["external_id"],
                platform_connected=profile_data["platform"],
            )
        except Exception as e:
            # If it's a duplicate / already exists error, ignore and mark status connected
            msg = str(e).lower()
            if any(k in msg for k in ("unique constraint", "duplicate key", "duplicate")):
                try:
                    update_social_account_status(profile_data["id"], "connected")
                except Exception:
                    # swallow secondary errors
                    pass
                return SaveIntegrationResponse(
                    brand_id=profile_data["external_id"],
                    platform_connected=profile_data["platform"],
                )
            # For other exceptions, signal a failed platform connection so caller can redirect accordingly
            return SaveIntegrationResponse(
                brand_id=profile_data["external_id"],
                platform_connected="failed",
            )


async def disconnect_integration(integration_id: str):
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"https://api.postforme.dev/v1/social-accounts/{integration_id}/disconnect",
            headers={"Authorization": f"Bearer {POST_FOR_ME_API_KEY}"},
        )
        
        r.raise_for_status()

        status = r.json()["status"]
        
        update_social_account_status(integration_id, "disconnected")

        return status == "disconnected"