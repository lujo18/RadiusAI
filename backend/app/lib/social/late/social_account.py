from fastapi import HTTPException
import httpx
from app.core.config import settings
from ..social_provider import CreateAuthUrlResponse


LATE_API_KEY = settings.LATE_API_KEY


async def create_auth_url(
    platform: str, redirect_url: str, late_profile_id: str
) -> CreateAuthUrlResponse:
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Late API uses GET with profileId and redirect_url query parameters
            params = {"redirect_url": redirect_url}
            if late_profile_id:
                params["profileId"] = late_profile_id

            response = await client.get(
                f"https://getlate.dev/api/v1/connect/{platform}",
                headers={"Authorization": f"Bearer {LATE_API_KEY}"},
                params=params,
            )
            response.raise_for_status()
            data = response.json()

        return CreateAuthUrlResponse(
            authUrl=data.get("authUrl"),
            platform=platform,
            message=f"Redirect user to authUrl to authorize {platform.title()} access",
        )

    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Late API error: {e.response.text}",
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Cannot reach Late API. Please check: 1) LATE_API_KEY is correct, 2) Internet connection is active, 3) Late API status at status.getlate.dev. Error: {str(e)}",
        )
