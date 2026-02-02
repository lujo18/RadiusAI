# Automation Worker - Quick Reference

## 🎯 What It Does

Every 10 minutes, the system:
1. Finds automations due for execution
2. Rotates through templates & CTAs
3. Generates carousels via Gemini
4. Posts to Instagram/TikTok via PostForMe
5. Records execution results
6. Schedules next run

## 📂 Location

```
backend/services/workers/automation/
├── automation_worker.py       # Main logic (process_due_automations, run_automation)
├── helpers.py                 # DB operations (7 functions)
├── schedule_calculator.py      # compute_next_run()
├── cron.py                     # Scheduler setup
└── __init__.py                 # Exports
```

## 🔑 Key Functions

### Main Entry Point
```python
# Called every 10 minutes by scheduler
async def process_due_automations()
```

### Single Automation Execution
```python
# Executes the 10-step pipeline for one automation
async def run_automation(automation_id: UUID) -> dict
```

### Database Helpers
```python
await fetch_due_automations()           # Get all automations where next_run_at <= now()
await lock_automation_row()             # Get & lock single automation
await get_template_by_id()              # Fetch template
await get_cta_by_id()                   # Fetch CTA
await insert_automation_run()           # Log execution
await update_automation_after_success()  # Save state & schedule next
await update_automation_after_failure()  # Increment error_count, may deactivate
```

### Schedule Computing
```python
compute_next_run(schedule)  # Returns datetime of next execution
validate_schedule(schedule) # Validates schedule format
```

## 📊 Database Tables

### automations
Stores automation config with rotation cursors:
- `template_ids[]` - array of UUIDs to rotate through
- `cta_ids[]` - array of UUIDs to rotate through
- `cursor_template_index` - current position in template_ids
- `cursor_cta_index` - current position in cta_ids
- `schedule` - JSONB like `{"monday": ["09:00"], "friday": ["14:00"]}`
- `next_run_at` - when to run next
- `is_active` - false if error_count >= 5
- `error_count` - deactivates at 5

### automation_runs
Logs every execution (success or failure):
- `automation_id`
- `status` - "success" or "failed"
- `template_id_used`
- `cta_id_used`
- `platforms_used`
- `error_message`

## ⚙️ 10-Step Execution Pipeline

```
1. Lock automation row (prevents concurrent execution)
2. Extract rotation items (template_ids[cursor] + cta_ids[cursor])
3. Fetch template & validate
4. Fetch CTA & validate
5. Get brand settings
6. Generate slideshow (1 post with Gemini 2.0)
7. Post to all platforms via PostForMe
8. Insert automation_runs record
9. Update rotation cursors (circular increment)
10. Compute next_run_at & update automation
```

## 🔄 Rotation Example

Template IDs: [T1, T2, T3], CTA IDs: [C1, C2]

```
Run 1: cursor=[0,0] → use T1+C1 → update to [1,1]
Run 2: cursor=[1,1] → use T2+C2 → update to [2,0]
Run 3: cursor=[2,0] → use T3+C1 → update to [0,1]
Run 4: cursor=[0,1] → use T1+C2 → update to [1,0]
(pattern repeats)
```

## 📅 Schedule Format

Stored as JSONB in `automations.schedule`:

```json
{
  "monday": ["09:00", "14:00"],
  "tuesday": ["09:00"],
  "wednesday": [],
  "thursday": ["14:00", "17:00"],
  "friday": ["12:00"],
  "saturday": ["10:00"],
  "sunday": []
}
```

Algorithm: Find next matching weekday/time combo, wraps around week as needed.

## ⚠️ Error Handling

- **Single platform fails** → logs error, tries next platform (soft fail)
- **Generation fails** → marks automation failed, increments error_count
- **5 consecutive errors** → `is_active = false` (auto-deactivation)
- **Next success** → `error_count = 0` (resets)

## 🚀 Integration with Main.py

```python
# In main.py lifespan():
scheduler.add_job(
    lambda: asyncio.run(process_due_automations()),
    CronTrigger(minute="*/10"),  # every 10 minutes
    id="automation_worker",
    max_instances=1,
    replace_existing=True,
)
```

## 📝 Example Log Output

```
[10:00] Starting automation worker
[10:00] Found 2 automations due for execution
[10:00] Automation abc123: using template T1, cta C2, platforms ['instagram', 'tiktok']
[10:00] Generated post post_xyz with 5 slides
[10:00] Posting to instagram
[10:00] Posting to tiktok
[10:00] Automation abc123 executed successfully
[10:05] Completed execution for 2/2 automations
```

## 🔧 Manual Operations

**View recent runs:**
```sql
SELECT * FROM automation_runs
WHERE automation_id = 'abc123'
ORDER BY run_started_at DESC
LIMIT 10
```

**Reactivate deactivated automation:**
```sql
UPDATE automations
SET is_active = true, error_count = 0
WHERE id = 'abc123'
```

**Force immediate execution:**
```sql
UPDATE automations
SET next_run_at = now()
WHERE id = 'abc123'
```

## 📋 Code Quality

✅ Pessimistic locking (FOR UPDATE simulation)  
✅ Concurrent execution with asyncio.gather()  
✅ Comprehensive error handling & logging  
✅ Graceful platform failure handling  
✅ Auto-deactivation after 5 errors  
✅ Type hints throughout  
✅ Follows existing codebase patterns  

## 🎉 Production Ready

- Integrated with FastAPI lifespan
- Scheduled via APScheduler
- Tested with frontend build
- Full error recovery
- Logging for debugging
