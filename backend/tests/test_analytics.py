import asyncio
import sys
from pathlib import Path

# Add backend directory to path first
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.core.workers.analytics.analytic_worker import (
    fetch_platform_metrics,
    process_due_posts,
)
from app.features.analytics.service import get_post_analytics


post_id = "a68ce25b-4e43-45f9-9229-39bcf19542a2"

try:
    val = asyncio.run(fetch_platform_metrics(post_id))

    print("Analytics", val)

except Exception as e:
    print("Failed to get analytics", e)


# try:
#   val = asyncio.run(process_due_posts())

#   print("Analytics", val)

# except Exception as e:
#   print("Failed to get analytics", e)
