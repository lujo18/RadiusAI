import requests
from backend.config import Config

# Connects a Twitter account to a Late profile
response = requests.get(
    'https://getlate.dev/api/v1/connect/twitter',
    params={'profileId': 'prof_abc123'},
    headers={'Authorization': f'Bearer {Config.LATE_API_KEY}'}
)

auth_url = response.json()['url']
print(f"Open this URL to authorize: {auth_url}")


# List all connected accounts in Late
response = requests.get(
    'https://getlate.dev/api/v1/accounts',
    headers={'Authorization': f'Bearer {Config.LATE_API_KEY}'}
)

accounts = response.json()['accounts']
for account in accounts:
    print(f"{account['platform']}: {account['_id']}")