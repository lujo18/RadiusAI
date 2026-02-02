# Automation Worker - Visual System Architecture

## 🏗️ System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FastAPI Application                          │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Application Lifespan                        │  │
│  │                                                                 │  │
│  │  startup() → Initialize APScheduler                           │  │
│  │              ├─ Analytics Worker (every 5 min)               │  │
│  │              └─ Automation Worker (every 10 min) ← NEW       │  │
│  │                                                                 │  │
│  │  shutdown() → Stop Scheduler                                  │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 10-Minute Automation Cycle

```
┌──────────────────────────────────────────────────────────────┐
│ EVERY 10 MINUTES (APScheduler CronTrigger)                   │
│ max_instances=1 (prevents overlapping)                       │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│ Step 1: Fetch Due Automations                                │
│ ────────────────────────────────────────────────────────────│
│                                                               │
│  SELECT * FROM automations                                   │
│  WHERE is_active = true                                      │
│    AND next_run_at <= now()                                 │
│  LIMIT 50                                                    │
│                                                               │
│  Result: Array of automation configs                         │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│ Step 2: Concurrent Execution                                 │
│ ────────────────────────────────────────────────────────────│
│                                                               │
│  asyncio.gather(*[run_automation(id) for each automation])   │
│                                                               │
│  ┌─ Automation 1 ──────────────────────────────────────┐    │
│  │                                                      │    │
│  │  10-Step Pipeline (see below)                       │    │
│  └──────────────────────────────────────────────────────┘    │
│  ┌─ Automation 2 ──────────────────────────────────────┐    │
│  │                                                      │    │
│  │  10-Step Pipeline (see below)                       │    │
│  └──────────────────────────────────────────────────────┘    │
│  ┌─ Automation N ──────────────────────────────────────┐    │
│  │                                                      │    │
│  │  10-Step Pipeline (see below)                       │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  [All running in parallel, independently]                    │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│ Step 3: Log Summary                                          │
│ ────────────────────────────────────────────────────────────│
│                                                               │
│  "Completed execution for 15/17 automations"                │
│                                                               │
│  Success: 15, Failed: 2, Deactivated: 0                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎯 10-Step Automation Execution Pipeline

```
Input: automation_id (UUID)

         ┌─────────────────────────────────────┐
         │ Step 1: Lock Automation Row          │
         │ ───────────────────────────────────│
         │ SELECT * FROM automations           │
         │ WHERE id = $1                       │
         │ (Pessimistic lock simulation)       │
         │ Returns: automation dict            │
         └────────────┬────────────────────────┘
                      │
                      ▼
         ┌─────────────────────────────────────┐
         │ Step 2: Extract Rotation Items       │
         │ ───────────────────────────────────│
         │ template_id =                        │
         │   template_ids[cursor_template]     │
         │ cta_id =                            │
         │   cta_ids[cursor_cta]               │
         │ platforms = platforms[]             │
         └────────────┬────────────────────────┘
                      │
                      ▼
         ┌─────────────────────────────────────┐
         │ Step 3: Fetch Template              │
         │ ───────────────────────────────────│
         │ SELECT * FROM templates             │
         │ WHERE id = $1 AND brand_id = $2    │
         │ Returns: template dict              │
         └────────────┬────────────────────────┘
                      │
                      ▼
         ┌─────────────────────────────────────┐
         │ Step 4: Fetch CTA                   │
         │ ───────────────────────────────────│
         │ SELECT * FROM brand_ctas            │
         │ WHERE id = $1 AND brand_id = $2    │
         │ Returns: CTA dict                   │
         └────────────┬────────────────────────┘
                      │
                      ▼
         ┌─────────────────────────────────────┐
         │ Step 5: Fetch Brand Settings        │
         │ ───────────────────────────────────│
         │ SELECT * FROM brands                │
         │ WHERE id = $1                       │
         │ Returns: brand dict                 │
         │ Convert to BrandSettings model      │
         └────────────┬────────────────────────┘
                      │
                      ▼
         ┌─────────────────────────────────────┐
         │ Step 6: Generate Slideshow          │
         │ ───────────────────────────────────│
         │ Call: generate_slideshows()         │
         │   ├─ Gemini 2.0 Flash              │
         │   ├─ SlideRenderer                  │
         │   ├─ Supabase Storage upload        │
         │   └─ Returns: [Post dict]           │
         │                                     │
         │ Result: 1 post with 5-10 slides    │
         │ storage_urls.slides = [URLs]        │
         └────────────┬────────────────────────┘
                      │
                      ▼
         ┌─────────────────────────────────────┐
         │ Step 7: Post to All Platforms       │
         │ ───────────────────────────────────│
         │ for platform in platforms:          │
         │   ├─ Call: make_post()              │
         │   │   └─ PostForMe API              │
         │   └─ Record: platform_used          │
         │                                     │
         │ [If 1 platform fails, continue]    │
         │ [All successes recorded in list]    │
         └────────────┬────────────────────────┘
                      │
                      ▼
         ┌─────────────────────────────────────┐
         │ Step 8: Insert Execution Record     │
         │ ───────────────────────────────────│
         │ INSERT INTO automation_runs         │
         │ {                                   │
         │   automation_id,                    │
         │   status: "success" or "failed",   │
         │   template_id_used,                 │
         │   cta_id_used,                      │
         │   platforms_used: [list],          │
         │   error_message                     │
         │ }                                   │
         └────────────┬────────────────────────┘
                      │
                      ▼
         ┌─────────────────────────────────────┐
         │ Step 9: Update Rotation Cursors     │
         │ ───────────────────────────────────│
         │ new_template_cursor =                │
         │   (cursor + 1) % len(template_ids) │
         │ new_cta_cursor =                    │
         │   (cursor + 1) % len(cta_ids)      │
         │                                     │
         │ Circular rotation without repeats   │
         └────────────┬────────────────────────┘
                      │
                      ▼
         ┌─────────────────────────────────────┐
         │ Step 10: Update Automation Row      │
         │ ───────────────────────────────────│
         │ UPDATE automations SET              │
         │   last_run_at = now(),              │
         │   next_run_at = computed_time,      │
         │   cursor_template_index =           │
         │     new_template_cursor,            │
         │   cursor_cta_index =                │
         │     new_cta_cursor,                 │
         │   error_count = 0,                  │
         │   last_error = NULL                 │
         │ WHERE id = $1                       │
         │                                     │
         │ [On failure: increment error_count] │
         │ [At error_count>=5: is_active=f]   │
         └────────────┬────────────────────────┘
                      │
                      ▼
         ┌─────────────────────────────────────┐
         │ SUCCESS ✅ or FAILURE ❌             │
         │ ───────────────────────────────────│
         │ Return: execution_result dict       │
         │ {                                   │
         │   status: "success" or "failed",   │
         │   automation_id,                    │
         │   template_id_used,                 │
         │   cta_id_used,                      │
         │   platforms_used,                   │
         │   error                             │
         │ }                                   │
         └─────────────────────────────────────┘
```

---

## 📊 State Rotation Visualization

### Initial State
```
template_ids:      [T1, T2, T3]
cta_ids:           [C1, C2]
cursor_template:   0
cursor_cta:        0
```

### Execution Sequence

```
Execution 1:
├─ Select: template_ids[0]=T1, cta_ids[0]=C1 ✓
├─ Publish: T1 + C1 → Instagram, TikTok
├─ Update: cursor_template=1, cursor_cta=1
└─ Next: Thursday 14:00 UTC


Execution 2:
├─ Select: template_ids[1]=T2, cta_ids[1]=C2 ✓
├─ Publish: T2 + C2 → Instagram
├─ Update: cursor_template=2, cursor_cta=0 (wraps)
└─ Next: Friday 09:00 UTC


Execution 3:
├─ Select: template_ids[2]=T3, cta_ids[0]=C1 ✓
├─ Publish: T3 + C1 → TikTok
├─ Update: cursor_template=0 (wraps), cursor_cta=1
└─ Next: Monday 12:00 UTC


Execution 4:
├─ Select: template_ids[0]=T1, cta_ids[1]=C2 ✓
├─ Publish: T1 + C2 → Instagram, TikTok
├─ Update: cursor_template=1, cursor_cta=0 (wraps)
└─ Next: Wednesday 14:00 UTC

[Pattern repeats...]
```

---

## 📅 Schedule Computation

```
Schedule: {
  "monday": ["09:00", "14:00"],
  "friday": ["12:00"],
  "sunday": []
}

Current Time: Tuesday 10:30 UTC

Algorithm:
1. Check Tuesday → No times configured
2. Check Wednesday → No times configured  
3. Check Thursday → No times configured
4. Check Friday ← Found!
   ├─ Time: 12:00
   ├─ Candidate: Friday 12:00 UTC
   ├─ Is it > now? Yes ✓
   └─ Return: Friday 12:00 UTC

Result: next_run_at = 2026-02-05 12:00:00 UTC
```

---

## 🛡️ Error Handling Flow

```
run_automation(id)
    │
    ├─ Exception during execution
    │
    ▼
✗ Record failure
    │
    ├─ error_count += 1
    ├─ last_error = error message
    │
    ▼
Check error_count:
    │
    ├─ < 5: Keep is_active = true
    │        [Next run will try again]
    │
    └─ >= 5: Set is_active = false
             [⚠️ DEACTIVATED - logs warning]
             [No more execution attempts]
             [Manual re-activation required]
```

---

## 🗄️ Database Interaction Map

```
┌──────────────────────────────────┐
│  automations                      │
├──────────────────────────────────┤
│ id                               │  ◄─ Locked per execution
│ brand_id                         │  
│ template_ids[]                   │  ◄─ [T1, T2, T3]
│ cta_ids[]                        │  ◄─ [C1, C2]
│ platforms[]                      │  ◄─ [instagram, tiktok]
│ schedule (JSONB)                 │  ◄─ {monday: [09:00]}
│ next_run_at ──┐                  │  ◄─ Updated after each run
│ cursor_*      │                  │  ◄─ Rotated after each run
│ is_active     │                  │  ◄─ false if error_count >= 5
│ error_count   │                  │  ◄─ Incremented on failure
│ last_error    │                  │
└────────┬──────┼──────────────────┘
         │      │
         │      └─ Computes with
         │         schedule_calculator
         │         .compute_next_run()
         │
         │  ┌──────────────────────────────────┐
         ├──► templates                        │
         │   ├──────────────────────────────────┤
         │   │ id, name, content_rules, ...    │
         │   └──────────────────────────────────┘
         │
         │  ┌──────────────────────────────────┐
         ├──► brand_ctas                       │
         │   ├──────────────────────────────────┤
         │   │ id, text, copy_rules, ...       │
         │   └──────────────────────────────────┘
         │
         │  ┌──────────────────────────────────┐
         ├──► brands                           │
         │   ├──────────────────────────────────┤
         │   │ id, name, niche, tone, ...      │
         │   └──────────────────────────────────┘
         │
         │  ┌──────────────────────────────────┐
         └──► automation_runs                  │
             ├──────────────────────────────────┤
             │ automation_id                   │
             │ run_started_at                  │  ◄─ Inserted after each run
             │ run_finished_at                 │
             │ status (success/failed)         │
             │ error_message                   │
             │ template_id_used                │
             │ cta_id_used                     │
             │ platforms_used[]                │
             └──────────────────────────────────┘
```

---

## 🔌 Integration with External Services

```
┌────────────────────────────────────────────────────────┐
│          Automation Worker                             │
└────────────────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┬──────────────┐
        │           │           │              │
        ▼           ▼           ▼              ▼
    Supabase    Gemini      PostForMe      SlideRenderer
    ────────    ──────      ────────       ─────────────
    
    • Tables    • Generate  • Publish      • Render
    • RLS       • AI        • Instagram      PNG slides
    • Storage   • Model:    • TikTok       • Upload to
              2.0 Flash     • API calls      Storage


    Dependencies:
    ├─ generate_slideshows()  ← calls Gemini + SlideRenderer + Storage
    ├─ make_post()            ← calls PostForMe API
    ├─ compute_next_run()     ← custom schedule logic
    └─ helpers.*()            ← Supabase queries
```

---

## 📈 Logging Architecture

```
All operations logged with:
├─ Timestamp (ISO 8601 UTC)
├─ Log level (INFO, ERROR, DEBUG, WARNING)
├─ Logger name (automation_worker, helpers, etc.)
├─ Context (automation_id, template_id, platform, etc.)
└─ Message (human-readable description)

Example:
[2026-02-01 10:05:23] [INFO] [automation_worker]
Automation abc123: using template T1, cta C2, platforms ['instagram', 'tiktok']

[2026-02-01 10:05:25] [ERROR] [helpers]
Error executing automation abc123: Gemini API rate limit exceeded

[2026-02-01 10:05:30] [WARNING] [automation_worker]
Deactivated automation abc123 after 5 consecutive errors
```

---

## ✨ Key Design Decisions

```
1. PESSIMISTIC LOCKING
   └─ Prevents double execution via SELECT queries
   
2. SOFT PLATFORM FAILURES  
   └─ 1 platform fails ≠ entire automation fails
   
3. CIRCULAR ROTATION
   └─ (index + 1) % len() ensures fair distribution
   
4. AUTO-DEACTIVATION
   └─ After 5 errors, stops attempting to run
   
5. CONCURRENT EXECUTION
   └─ asyncio.gather() for N automations in parallel
   
6. STATE ATOMICITY
   └─ All state changes in single UPDATE query
   
7. COMPREHENSIVE LOGGING
   └─ Every operation logged for debugging
```

---

This visual guide maps out the entire automation worker system from scheduler through database interactions.
