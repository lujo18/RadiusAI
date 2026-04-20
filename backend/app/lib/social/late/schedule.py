import requests
from app.core.config import settings

# Schedule a post via the Late API
response = requests.post(
    "https://getlate.dev/api/v1/posts",
    headers={"Authorization": f"Bearer {settings.LATE_API_KEY}"},
    json={
        "content": "Hello world! This is my first post from the Late API 🚀",
        "scheduledFor": "2024-01-16T12:00:00",
        "timezone": "America/New_York",
        "platforms": [{"platform": "twitter", "accountId": "acc_xyz789"}],
    },
)

post = response.json()
print(f"Post scheduled: {post['_id']}")


# Cross-posting to multiple accounts via the Late API
response = requests.post(
    "https://getlate.dev/api/v1/posts",
    headers={"Authorization": f"Bearer {settings.LATE_API_KEY}"},
    json={
        "content": "Cross-posting to all my accounts!",
        "scheduledFor": "2024-01-16T12:00:00",
        "timezone": "America/New_York",
        "platforms": [
            {"platform": "twitter", "accountId": "acc_twitter123"},
            {"platform": "linkedin", "accountId": "acc_linkedin456"},
            {"platform": "bluesky", "accountId": "acc_bluesky789"},
        ],
    },
)

post = response.json()
print(f"Cross-posted: {post['_id']}")


# Immediate publishing via the Late API
response = requests.post(
    "https://getlate.dev/api/v1/posts",
    headers={"Authorization": f"Bearer {settings.LATE_API_KEY}"},
    json={
        "content": "This posts immediately!",
        "publishNow": True,
        "platforms": [{"platform": "twitter", "accountId": "acc_xyz789"}],
    },
)

post = response.json()
print(f"Published: {post['_id']}")
