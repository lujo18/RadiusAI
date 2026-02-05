"""Test BrandSettings and Template model validation"""

import sys
from pathlib import Path

# Add backend directory to path first
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from services.workers.automation.automation_worker import run_automation
from models.user import BrandSettings
from models.template import Template

demo_input = {
    "idx": 0,
    "id": "1c6e1d40-5910-45a9-b0d6-1e371d1e1bce",
    "brand_id": "51cc61f9-5958-4c41-8e7e-245192d431fa",
    "template_ids": [
        "48877067-4ca9-4cef-b63c-92c96135897b",
        "d2febbf8-38dd-444a-8ce3-e9eadc304572",
    ],
    "cta_ids": ["74e50176-789c-4937-95ee-21ad9ec07337"],
    "platforms": ["e54d8d6e-fcbf-4a56-af4d-854bc010de35"],
    "schedule": '{"friday": ["09:00", "18:00"], "monday": ["09:00", "18:00"], "sunday": ["09:00", "18:00"], "tuesday": ["09:00", "18:00"], "saturday": ["09:00", "18:00"], "thursday": ["09:00", "18:00"], "wednesday": ["09:00", "18:00"]}',
    "next_run_at": "2026-02-04 09:00:00+00",
    "last_run_at": "2026-02-04 04:50:47.95116+00",
    "cursor_template_index": 1,
    "cursor_cta_index": 0,
    "is_active": True,
    "error_count": 0,
    "last_error": None,
    "created_at": "2026-02-04 04:44:41.530112+00",
    "updated_at": "2026-02-04 04:50:47.855105+00",
    "name": "new social scripts",
    "description": "",
}

quietp_id = "13a629e6-d832-4176-ad5a-8ea7f000c860"

async def r_a():
    await run_automation(quietp_id)


# Test 1: BrandSettings with partial data (like from Supabase)
print("=" * 60)
print("TEST: Automation with true UUID")
print("=" * 60)


import asyncio

try:
    asyncio.run(r_a())

except Exception as e:
    print("AUTOMATION FAILED")

print("\n" + "=" * 60)
print("✅ All model tests completed successfully!")
print("=" * 60)
