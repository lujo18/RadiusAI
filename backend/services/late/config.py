from backend.config import Config
import requests

api_key = Config.LATE_API_KEY

response = requests.get(
    'https://getlate.dev/api/v1/posts',
    headers={'Authorization': f'Bearer {api_key}'}
)