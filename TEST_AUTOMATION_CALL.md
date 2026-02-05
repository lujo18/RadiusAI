# Testing Automation Calls - Complete Guide

## 🎯 Overview

The automation worker runs every **10 minutes** and processes automations due for execution. Here are multiple ways to test it:

---

## Option 1: Direct Function Call (Fastest for Development)

### Setup
```bash
# Terminal 1: Start backend
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

### Test Script - Create `test_automation.py`

```python
"""Test automation execution directly without waiting for scheduler"""
import asyncio
import sys
from pathlib import Path
from uuid import UUID
from datetime import datetime, timezone, timedelta

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from backend.services.workers.automation.automation_worker import run_automation
from backend.services.integrations.supabase.client import get_supabase
from dotenv import load_dotenv

load_dotenv()

async def test_automation():
    """Run a single automation directly"""
    
    supabase = get_supabase()
    
    # 1. Fetch an active automation
    response = supabase.table("automations").select("*").eq("is_active", True).limit(1).execute()
    
    if not response.data:
        print("❌ No active automations found")
        print("   Create one first in the UI: /automation page")
        return
    
    automation = response.data[0]
    automation_id = automation["id"]
    
    print(f"\n🔧 Testing Automation: {automation['name']}")
    print(f"   ID: {automation_id}")
    print(f"   Templates: {automation['template_ids']}")
    print(f"   CTAs: {automation['cta_ids']}")
    print(f"   Platforms: {automation['platforms']}")
    print(f"   Cursor Template: {automation['cursor_template_index']}")
    print(f"   Cursor CTA: {automation['cursor_cta_index']}")
    
    # 2. Run the automation
    print(f"\n⏳ Running automation...")
    try:
        result = await run_automation(UUID(automation_id))
        print(f"\n✅ Success!")
        print(f"   Status: {result['status']}")
        print(f"   Template Used: {result['template_id_used']}")
        print(f"   CTA Used: {result['cta_id_used']}")
        print(f"   Platforms: {result['platforms_used']}")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_automation())
```

### Run It
```bash
# Terminal 2: Run test script
cd backend
python test_automation.py
```

### Output Example
```
🔧 Testing Automation: Weekly Tech Tips
   ID: 550e8400-e29b-41d4-a716-446655440000
   Templates: ['t1', 't2', 't3']
   CTAs: ['c1', 'c2']
   Platforms: ['instagram', 'tiktok']
   Cursor Template: 0
   Cursor CTA: 0

⏳ Running automation...

✅ Success!
   Status: success
   Template Used: t1
   CTA Used: c1
   Platforms: ['instagram', 'tiktok']
```

---

## Option 2: Trigger Scheduler Immediately

### Python Script - `trigger_automation_worker.py`

```python
"""Trigger the automation worker immediately without waiting 10 minutes"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from backend.services.workers.automation.automation_worker import process_due_automations
from dotenv import load_dotenv

load_dotenv()

async def main():
    print("🚀 Triggering automation worker...")
    await process_due_automations()
    print("✅ Automation worker completed")

if __name__ == "__main__":
    asyncio.run(main())
```

### Run It
```bash
cd backend
python trigger_automation_worker.py
```

---

## Option 3: Create Test Automation via Database

### Directly Insert Test Automation

```sql
-- Run in Supabase SQL Editor
INSERT INTO automations (
  brand_id,
  name,
  template_ids,
  cta_ids,
  platforms,
  schedule_days,
  schedule_times,
  next_run_at,
  is_active,
  cursor_template_index,
  cursor_cta_index
)
VALUES (
  'your-brand-id-here',
  'Test Automation',
  ARRAY['template-1-uuid', 'template-2-uuid']::uuid[],
  ARRAY['cta-1-uuid', 'cta-2-uuid']::uuid[],
  ARRAY['instagram', 'tiktok']::text[],
  ARRAY['monday', 'wednesday', 'friday']::text[],
  ARRAY['09:00', '15:00']::text[],
  NOW(),  -- Set to now to trigger immediately
  true,
  0,
  0
)
RETURNING *;
```

---

## Option 4: Modify Next Run Time of Existing Automation

### Set to Run Immediately

```sql
-- In Supabase SQL Editor
UPDATE automations 
SET next_run_at = NOW()
WHERE id = 'your-automation-id'
RETURNING id, name, next_run_at;
```

Then wait **~10 minutes** for the scheduler to pick it up, or use **Option 1** to run immediately.

---

## Option 5: Full End-to-End Test via UI

### Step 1: Create Automation via UI
```
1. Go to /automation page
2. Step 1: Enter name + description
3. Step 2: Select templates (2+)
4. Step 3: Select CTAs (2+)
5. Step 4: Select platforms (Instagram, TikTok, etc.)
6. Step 5: Select schedule
7. Step 6: Review & Create
```

### Step 2: Wait for Scheduler or Use Script
```bash
# Option A: Wait 10 minutes
# Option B: Run test_automation.py to trigger immediately
python test_automation.py
```

### Step 3: Check Results
```bash
# View logs
# Check automations table: cursor_template_index and cursor_cta_index should increment
# Check automation_runs table: should have a new record
# Check posts table: should have new posts created
```

---

## 🔍 Debugging - View Logs

### Option 1: Backend Console
```
uvicorn output in terminal shows logs like:
- "Starting execution for automation {id}"
- "using template {t}, cta {c}, platforms {p}"
- "Completed execution..."
```

### Option 2: Supabase Logs
```
Go to: Supabase Dashboard → Logs → check postgres/api logs
```

### Option 3: Python Logging
```python
import logging

logger = logging.getLogger(__name__)
logger.info(f"Debug: {variable}")
logger.error(f"Error: {error}")
```

---

## 📊 Verify Success - Check Database

### 1. Check automation_runs Table
```sql
SELECT 
  automation_id,
  status,
  template_id_used,
  cta_id_used,
  posts_created,
  created_at
FROM automation_runs
ORDER BY created_at DESC
LIMIT 5;
```

### 2. Check Cursor Incremented
```sql
SELECT 
  id,
  name,
  cursor_template_index,
  cursor_cta_index,
  next_run_at
FROM automations
WHERE id = 'your-automation-id';
```

**Expected:** cursor_template_index and cursor_cta_index should increment

### 3. Check Posts Created
```sql
SELECT 
  id,
  automation_id,
  template_id,
  status,
  created_at
FROM posts
WHERE automation_id = 'your-automation-id'
ORDER BY created_at DESC
LIMIT 5;
```

---

## 🐛 Common Issues & Fixes

### ❌ "No automations due for execution"
- **Cause:** `next_run_at` is in the future
- **Fix:** Set `next_run_at = NOW()` in database or create new automation

### ❌ "Automation {id} not found"
- **Cause:** Wrong automation ID or brand doesn't have access
- **Fix:** Verify ID exists and matches your brand

### ❌ "Missing required fields"
- **Cause:** template_ids, cta_ids, or platforms is empty
- **Fix:** 
  ```sql
  UPDATE automations 
  SET template_ids = ARRAY['uuid1', 'uuid2'],
      cta_ids = ARRAY['uuid1', 'uuid2'],
      platforms = ARRAY['instagram', 'tiktok']
  WHERE id = '...';
  ```

### ❌ "Template/CTA not found"
- **Cause:** IDs don't exist or wrong brand
- **Fix:** Check templates/brand_ctas tables for correct IDs

### ❌ "Brand not found"
- **Cause:** brand_id doesn't exist
- **Fix:** Verify automation.brand_id exists in brands table

---

## 🚀 Recommended Testing Flow

### For Quick Testing:
```bash
# 1. Use Option 1 (Direct Function Call)
python test_automation.py

# 2. Check logs in console
# 3. Verify in Supabase Dashboard
# 4. Inspect automation_runs table
```

### For Full Testing:
```bash
# 1. Create automation via UI (/automation page)
# 2. Run test_automation.py immediately
# 3. Check database tables
# 4. View logs
# 5. Verify posts created
```

### For Production Testing:
```bash
# 1. Let scheduler run naturally (every 10 minutes)
# 2. Monitor backend logs
# 3. Check automation_runs table regularly
# 4. Set alerts if status != 'success'
```

---

## 📋 Automation Structure

```python
{
  "id": "uuid",
  "brand_id": "uuid",
  "name": "Weekly Tech Tips",
  "template_ids": ["t1-uuid", "t2-uuid", "t3-uuid"],
  "cta_ids": ["c1-uuid", "c2-uuid"],
  "platforms": ["instagram", "tiktok"],
  "schedule_days": ["monday", "wednesday", "friday"],
  "schedule_times": ["09:00", "15:00"],  # UTC
  "next_run_at": "2026-02-03T09:00:00Z",
  "is_active": true,
  "cursor_template_index": 0,  # Which template to use next
  "cursor_cta_index": 0,        # Which CTA to use next
}
```

---

## ✅ Success Indicators

- ✅ `status: "success"` in automation_runs
- ✅ `cursor_template_index` incremented
- ✅ `cursor_cta_index` incremented
- ✅ New post(s) created with correct template and CTA
- ✅ `next_run_at` updated to next schedule slot
- ✅ No errors in backend logs

