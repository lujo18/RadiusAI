import asyncio
import httpx
import sys
import os
from pathlib import Path

# Add backend root to path (go up 6 levels to reach backend/)
backend_root = Path(__file__).parent.parent.parent.parent.parent.parent
sys.path.insert(0, str(backend_root))

from config import Config

PFM_TOKEN = Config.POST_FOR_ME_API_KEY


async def create_webhook():
    async with httpx.AsyncClient() as client:
      r = await client.patch(
          "https://api.postforme.dev/v1/webhooks/wbh_93ZCqRgeSkSquCiLj3Vvt",
          headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {PFM_TOKEN}"
          },
          json={
            "url": "https://api.useradius.app/api/webhooks/postforme/post",
            "event_types": [
              "social.post.updated",
              "social.post.created",
              "social.post.deleted"
            ]
          }
      )
        
      r.raise_for_status()
      resp = r.json()
      return resp
try:
  res = asyncio.run(create_webhook())
  print("Webhook created: ", res)

except Exception as e:
  print("Failed to edit webhook", e)
  
  