from app.core.config import settings
import requests

api_key = settings.LATE_API_KEY

response = requests.get(
    "https://getlate.dev/api/v1/posts", headers={"Authorization": f"Bearer {api_key}"}
)
