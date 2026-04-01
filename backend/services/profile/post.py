from app.core.config import settings
import requests

from app.features.posts.schemas import Post


def send_post(post: Post, lateAccountId: str, publishNow: bool) -> bool:
    api_key = settings.LATE_API_KEY

    post_content = post.content

    response = requests.post(
        "https://getlate.dev/api/v1/posts",
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "content": post_content.caption,
            "mediaItems": [{"url": slide} for slide in post.storage_urls["slides"]],
            "platforms": [{"platform": "tiktok", "accountId": lateAccountId}],
            "tiktokSettings": {
                "privacy_level": "PUBLIC_TO_EVERYONE",
                "allow_comment": True,
                "media_type": "photo",
                "photo_cover_index": 0,
                "content_preview_confirmed": True,
                "express_consent_given": True,
                "auto_add_music": True,
                "video_made_with_ai": True,
                "draft": True,
            },
            "publishNow": publishNow,
        },
    )

    if response.status_code == 200:
        return True
    return False

    print(response.text)
