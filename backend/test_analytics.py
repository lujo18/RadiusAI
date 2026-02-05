import asyncio
import sys
from pathlib import Path

# Add backend directory to path first
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from services.workers.analytics.analytic_worker import fetch_platform_metrics, process_due_posts
from services.analytics_service import get_post_analytics


post_id = "1ac8333f-979e-48d9-81a3-0f75f73550c9"

try:
  val = asyncio.run(process_due_posts())
  
  print("Analytics", val)
  
except Exception as e:
  print("Failed to get analytics", e)