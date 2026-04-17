import requests

from app.core.config import settings

# Schedule a post via the Late API


def post_to_tiktok(description: str, carousel_img_urls: list[str], account_id: str):
    response = requests.post(
        "https://getlate.dev/api/v1/posts",
        headers={"Authorization": f"Bearer {settings.LATE_API_KEY}"},
        json={
            "content": description,
            "mediaItems": [
                {"url": carousel_img_url} for carousel_img_url in carousel_img_urls
            ],
            "platforms": [{"platform": "tiktok", "accountId": account_id}],
            "tiktokSettings": {
                "privacy_level": "PUBLIC_TO_EVERYONE",
                "allow_comment": True,
                "allow_duet": True,
                "allow_stitch": True,
                "content_preview_confirmed": True,
                "express_consent_given": True,
            },
            "publishNow": True,
        },
    )

    post = response.json()
    print(f"Posted to TikTok! {post['_id']}")
