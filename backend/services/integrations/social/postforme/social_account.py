from typing import List
from typing import Optional, Literal
import httpx

from backend.config import Config
from backend.models.post import Post
from backend.services.integrations.supabase.db.post import (
    get_post,
    update_post,
    update_post_status,
)
from ..social_provider import CreateAuthUrlResponse, SaveIntegrationResponse
from typing import cast
from backend.services.integrations.supabase.db.brand import (
    connect_social_account_to_brand,
    get_social_accounts,
    update_social_account_status,
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
            if any(
                k in msg for k in ("unique constraint", "duplicate key", "duplicate")
            ):
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


async def make_post(
    brand_id: str,
    platforms: List[str],
    post_id: str,
    mode: Literal["draft", "scheduled", "publish"] = "publish",
    scheduled_at: Optional[str] = None,
):
    """Create / schedule / publish a post via PostForMe.

    mode:
      - 'draft' : mark post as draft
      - 'scheduled' : set scheduled_time + status
      - 'publish' : call PostForMe and update external ids + status
    """

    raw_post = get_post(post_id)
    if not raw_post:
        raise ValueError(f"post {post_id} not found")

    # Ensure brand matches
    if raw_post.get("brand_id") != brand_id:
        raise PermissionError("brand_id does not match post")

    user_id = raw_post.get("user_id")

    # Draft flow: just update status
    if mode == "draft":
        update_post(post_id, {"status": "draft"}, user_id)
        return {"status": "draft"}

    # Scheduled flow: set scheduled_time and status
    if mode == "scheduled":
        updates = {"status": "scheduled"}
        if scheduled_at:
            updates["scheduled_time"] = scheduled_at
        update_post(post_id, updates, user_id)
        return {"status": "scheduled", "scheduled_at": scheduled_at}

    # Publish flow
    # 1) collect connected integrations
    social_integrations = get_social_accounts(brand_id, platforms)

    # Extract pfm account ids defensively
    pfm_account_ids = []
    for si in (social_integrations or []):
        if isinstance(si, dict):
            pfm_account_ids.append(si.get("pfm_account_id") or si.get("post_for_me_account_id"))
        else:
            pfm_account_ids.append(getattr(si, "pfm_account_id", None) or getattr(si, "post_for_me_account_id", None))
    pfm_account_ids = [p for p in pfm_account_ids if p]

    # 2) build media payload from storage_urls
    storage = raw_post.get("storage_urls") or {}
    slides = []
    if isinstance(storage, dict):
        slides = storage.get("slides") or []

    media_urls = [{"url": u} for u in slides]

    # 3) caption & hashtags
    content = raw_post.get("content") or {}
    caption = content.get("caption") if isinstance(content, dict) else ""
    hashtags_list = content.get("hashtags") if isinstance(content, dict) else []
    hashtags = " ".join("#" + h for h in (hashtags_list or []))

    payload = {
        "caption": caption,
        "scheduled_at": scheduled_at,
        "platform_configurations": {
            "tiktok": {
                "caption": f"{caption} {hashtags}".strip(),
                "title": caption,
                "privacy_status": "public",
                "allow_comment": True,
                "allow_duet": True,
                "allow_stitch": True,
                "disclose_your_brand": False,
                "disclose_branded_content": False,
                "is_ai_generated": False,
                "is_draft": False,
            }
        },
        "media": media_urls,
        "social_accounts": pfm_account_ids,
    }

    async with httpx.AsyncClient() as client:
        r = await client.post(
            "https://api.postforme.dev/v1/social-posts",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {POST_FOR_ME_API_KEY}",
            },
            json=payload,
            timeout=30.0,
        )
        r.raise_for_status()
        resp = r.json()

    # Persist external ids and mark published
    external_post_id = resp.get("id") or resp.get("post_id")

    updates = {"status": "published"}
    if external_post_id:
        updates["external_post_id"] = external_post_id

    update_post(post_id, updates, user_id)

    return {"status": "published", "external_post_id": external_post_id}


async def publish_post(brand_id: str, platforms: List[str], post_id: str):
    return await make_post(brand_id, platforms, post_id, mode="publish")


async def schedule_post(brand_id: str, platforms: List[str], post_id: str, scheduled_at: str):
    return await make_post(brand_id, platforms, post_id, mode="scheduled", scheduled_at=scheduled_at)


async def draft_post(brand_id: str, platforms: List[str], post_id: str):
    return await make_post(brand_id, platforms, post_id, mode="draft")

    # 1. query for all accounts under brand_id and platform
    # 2. organize the json for coresponding platforms and extract post info
    # 3. make postforme call
    # 4. save coresponding postid from pfm in post change status to posted
    # fill: external-account-id (from pfm)
    # fill: external-post-id (from pfm)
    # fill: external-permalink (if in pfm response)

    raw_post = get_post(post_id)
    post = Post(**raw_post)

    social_integrations = get_social_accounts(brand_id, platforms)

    pfm_account_ids = [si.pfm_account_id for si in (social_integrations)]

    media_urls = [{"url": slide_url} for slide_url in (post.storage_urls["slides"])]

    # build a single string of hashtags like "#tag1 #tag2", safe if no hashtags present
    hashtags = " ".join("#" + hashtag for hashtag in (post.content.hashtags or []))

    async with httpx.AsyncClient() as client:
        r = await client.post(
            "https://api.postforme.dev/v1/social-posts",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {POST_FOR_ME_API_KEY}",
            },
            json={
                "caption": post.content.caption,
                "scheduled_at": None,
                "platform_configurations": {
                    "tiktok": {
                        "caption": f"{post.content.caption} {hashtags}".strip(),
                        "title": post.content.caption,
                        "privacy_status": "public",
                        "allow_comment": True,
                        "allow_duet": True,
                        "allow_stitch": True,
                        "disclose_your_brand": False,
                        "disclose_branded_content": False,
                        "is_ai_generated": False,
                        "is_draft": True,
                        "auto_add_music": True
                    },
                },
                "media": media_urls,
                "social_accounts": pfm_account_ids,
            },
        )
        
        r.raise_for_status()

        post_data = r.json()
        
        

    return dict()
