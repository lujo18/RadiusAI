# Analytics Worker - Visual Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FastAPI Application                      │
│                       (backend/main.py)                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌──────────────────────┐
                    │   APScheduler        │
                    │  (Runs every 5min)   │
                    └──────────────────────┘
                              ↓
        ┌─────────────────────────────────────────────┐
        │   process_due_posts()                       │
        │   (analytic_worker.py)                      │
        └─────────────────────────────────────────────┘
                              ↓
            ┌─────────────────────────────────┐
            │  Query Supabase                 │
            │  post_tracking_metadata         │
            │  WHERE next_collection_at ≤ now │
            └─────────────────────────────────┘
                              ↓
                    [For Each Post]
                              ↓
            ┌────────────────────────────────────┐
            │  fetch_platform_metrics()          │
            │  Get: external_post_id (pfm_id)    │
            └────────────────────────────────────┘
                              ↓
            ┌────────────────────────────────────┐
            │  PostForMe Analytics Client        │
            │  (analytics_client.py)             │
            │                                    │
            │  GET /v1/items                     │
            │   ?social_post_id=X                │
            │   &limit=1                         │
            │   &expand=["metrics"]              │
            └────────────────────────────────────┘
                              ↓
                    ┌──────────────────┐
                    │  PostForMe API   │
                    │ api.postforme.dev│
                    └──────────────────┘
                              ↓
            ┌────────────────────────────────────┐
            │  Response: PostForMeAnalyticsResponse│
            │  - platform                         │
            │  - metrics {likes, comments, ...}  │
            │  - meta {cursor, has_more}          │
            └────────────────────────────────────┘
                              ↓
            ┌────────────────────────────────────┐
            │  Map Metrics                       │
            │  - favorites → saves               │
            │  - reach → impressions             │
            │  - calc engagement_rate            │
            └────────────────────────────────────┘
                              ↓
            ┌────────────────────────────────────┐
            │  Upsert to Supabase                │
            │  post_analytics table              │
            │  (update if exists, insert new)    │
            └────────────────────────────────────┘
                              ↓
            ┌────────────────────────────────────┐
            │  Update Tracking Metadata          │
            │  post_tracking_metadata table      │
            │  - current_interval (hourly/daily) │
            │  - next_collection_at (next run)   │
            │  - collection_count++              │
            └────────────────────────────────────┘
                              ↓
                    [Back to Loop]
```

---

## Data Models

```
┌─────────────────────────┐
│  Post Published Event   │
└───────────┬─────────────┘
            ↓
  ┌─────────────────────────────────┐
  │  update_post_status()           │
  │  - status = "published"         │
  │  - published_time = NOW()       │
  └────────────┬────────────────────┘
               ↓
  ┌──────────────────────────────────┐
  │  create_analytic_tracker()       │
  │  [Auto-called on publish]        │
  └────────────┬─────────────────────┘
               ↓
  ┌──────────────────────────────────┐
  │  INSERT post_tracking_metadata   │
  │  ┌────────────────────────────┐  │
  │  │ post_id: UUID              │  │
  │  │ current_interval: 'hourly' │  │
  │  │ next_collection_at: +1h    │  │
  │  │ collection_count: 0        │  │
  │  │ last_collected_at: NULL    │  │
  │  └────────────────────────────┘  │
  └──────────────────────────────────┘
```

---

## Collection Schedule Timeline

```
Post Published at T=0
│
├─ T=0h: INSERT post_tracking_metadata (next_collection_at = T+1h)
│
├─ T=1h: [CRON RUN 1] Collect metrics
│         └─> Update post_analytics
│         └─> Update next_collection_at = T+24h (daily)
│
├─ T=24h: [CRON RUN 2] Collect metrics
│          └─> Update post_analytics
│          └─> Update next_collection_at = T+7d (weekly)
│
├─ T+7d: [CRON RUN 3] Collect metrics
│         └─> Update post_analytics
│         └─> Update next_collection_at = T+30d (monthly)
│
├─ T+30d: [CRON RUN 4] Collect metrics
│          └─> Update post_analytics
│          └─> Update next_collection_at = T+90d
│
└─ T+90d: [CRON RUN 5] Stop tracking
           └─> No more collections
```

---

## File Organization

```
backend/
├── main.py                          ← Scheduler integration
├── models/
│   ├── analytics.py                 ← Analytics models
│   └── postforme_analytics.py       ← PostForMe response models
├── services/
│   ├── analytics_service.py         ← Helper functions
│   ├── workers/
│   │   └── analytics/
│   │       ├── analytic_worker.py   ← Main worker
│   │       ├── create_analytic_tracker.py
│   │       ├── pick_interval.py
│   │       └── cron.py
│   └── integrations/
│       └── social/
│           └── postforme/
│               └── analytics_client.py ← PostForMe HTTP client
└── routers/
    └── (future: /api/analytics endpoints)
```

---

## Request/Response Flow

### 1. Publish Flow
```
User Action
  └─> POST /api/post/publish
      └─> update_post_status("published")
          └─> create_analytic_tracker()
              └─> INSERT post_tracking_metadata
                  └─> Response: {"status": "published"}
```

### 2. Collection Flow (every 5 minutes)
```
APScheduler
  └─> process_due_posts()
      └─> SELECT from post_tracking_metadata WHERE next_collection_at ≤ now
          └─> For each post:
              ├─> GET external_post_id
              ├─> PostForMeAnalyticsClient.get_post_analytics()
              │   └─> GET /v1/items?social_post_id=X&expand=["metrics"]
              ├─> Parse PostForMeAnalyticsResponse
              ├─> Map metrics
              ├─> UPSERT post_analytics
              └─> UPDATE post_tracking_metadata
```

### 3. Query Analytics Flow
```
Frontend/API
  └─> GET /api/analytics/posts/{postId}
      └─> get_post_analytics(post_id)
          └─> SELECT from post_analytics WHERE post_id = X
              └─> Response: {likes, comments, shares, ...}
```

---

## State Machine: Post Age → Collection Interval

```
                    Post Published (age = 0h)
                           ↓
                    Interval: HOURLY
                    (collect every 1 hour)
                    age_hours: 0-24
                           ↓
                        [After 24h]
                           ↓
                    Interval: DAILY
                    (collect every 1 day)
                    age_hours: 24-168
                           ↓
                        [After 7 days]
                           ↓
                    Interval: WEEKLY
                    (collect every 7 days)
                    age_hours: 168-672
                           ↓
                        [After 28 days]
                           ↓
                    Interval: MONTHLY
                    (collect every 30 days)
                    age_hours: 672-2160
                           ↓
                        [After 90 days]
                           ↓
                    STOP TRACKING
                    (no more collections)
                    age_hours: 2160+
```

---

## API Integration Points

```
┌────────────────────────────────────────┐
│      Application Boundary              │
├────────────────────────────────────────┤
│                                        │
│  Backend (Python/FastAPI)              │
│  ├─ analytic_worker.py                │
│  ├─ analytics_client.py                │
│  └─ analytics_service.py               │
│       │                                │
│       ├─ Supabase SDK                 │
│       │   └─ SELECT/INSERT/UPDATE      │
│       │       ├─ posts                │
│       │       ├─ post_analytics       │
│       │       └─ post_tracking_metadata
│       │                                │
│       └─ HTTP Client (httpx)           │
│           └─ GET /v1/items             │
│               (PostForMe API)          │
│                                        │
│  Frontend (TypeScript/React)           │
│  ├─ useQuery hooks                     │
│  ├─ analytics_service                 │
│  └─ UI components                      │
│       │                                │
│       └─ HTTP Client (fetch/axios)     │
│           └─ GET /api/analytics/*      │
│               (Future endpoints)       │
│                                        │
└────────────────────────────────────────┘
         ↓                    ↓
    ┌─────────────┐  ┌───────────────────┐
    │  Supabase   │  │  PostForMe API    │
    │ PostgreSQL  │  │ api.postforme.dev │
    └─────────────┘  └───────────────────┘
```

---

## Error Handling Flow

```
process_due_posts()
  └─ Try: Get due posts from Supabase
     ├─ Catch Exception: Log ERROR, exit early
     └─ Continue with fetched posts
        └─ For each post:
           └─ Try: process_single_post()
              ├─ Try: fetch_platform_metrics()
              │  ├─ Try: Get post from Supabase
              │  │  ├─ Catch: Log WARNING, return {}
              │  │  └─ Continue with post
              │  ├─ Try: Call PostForMe API
              │  │  ├─ Catch HTTPError: Log ERROR, return {}
              │  │  └─ Continue with response
              │  └─ Return metrics dict or {}
              ├─ Try: Upsert post_analytics
              │  └─ Catch: Log ERROR, continue
              ├─ Try: Update tracking metadata
              │  └─ Catch: Log ERROR, continue
              └─ Catch: Log ERROR, continue to next post
                 (One post's error doesn't block others)
```

---

## Concurrency Model

```
process_due_posts()
  │
  ├─ Fetch 50 posts (max BATCH_SIZE)
  │
  ├─ Create 50 async tasks:
  │  ├─ process_single_post(post_1)
  │  ├─ process_single_post(post_2)
  │  ├─ ...
  │  └─ process_single_post(post_50)
  │
  └─ await asyncio.gather(*tasks)
     (All 50 posts processed in parallel)
     │
     ├─ Each task makes HTTP request to PostForMe
     │  (No blocking, all async)
     │
     └─ Each task updates Supabase
        (Concurrent, but safe with ACID)
```

**Result:** 50 posts processed in ~5-10 seconds total (vs 250+ seconds sequentially)

---

## Type Safety Layer

```
HTTP Response (JSON)
      ↓
┌──────────────────────────────────┐
│ PostForMeAnalyticsResponse        │
│ (Pydantic BaseModel)             │
│ ├─ data: List[PostForMeItem]     │
│ │  ├─ platform: str              │
│ │  ├─ metrics: PostForMeMetrics  │
│ │  │  ├─ likes: int              │
│ │  │  ├─ comments: int           │
│ │  │  └─ ...                      │
│ │  └─ ...                         │
│ └─ meta: PostForMePaginationMeta │
└──────────────────────────────────┘
      ↓
┌──────────────────────────────────┐
│ Python dict (type-safe)          │
│ {                                │
│   "likes": 42,                   │
│   "comments": 5,                 │
│   "saves": 12,                   │
│   "impressions": 1000,           │
│   "engagement_rate": 0.059,      │
│   "last_updated": "2026-..."     │
│ }                                │
└──────────────────────────────────┘
      ↓
┌──────────────────────────────────┐
│ Supabase INSERT (SQL typed)      │
│ UPDATE post_analytics SET ...    │
└──────────────────────────────────┘
      ↓
┌──────────────────────────────────┐
│ Frontend TypeScript              │
│ type PostAnalytics = {           │
│   likes: number;                 │
│   comments: number;              │
│   ...                            │
│ }                                │
└──────────────────────────────────┘
```

---

## Database Indexes & Performance

```
post_tracking_metadata Table
├─ PRIMARY KEY: post_id
├─ INDEX: (next_collection_at ASC)
│         Used for: WHERE next_collection_at ≤ now
└─ INDEX: (current_interval)
          Used for: Sorting by collection type

post_analytics Table
├─ PRIMARY KEY: post_id
├─ INDEX: (last_updated DESC)
│         Used for: Recent metrics queries
└─ INDEX: (post_id, last_updated)
          Used for: Time-series analytics
```

---

## Deployment Architecture (Production)

```
┌──────────────────────────────────────┐
│         Cloud Platform               │
│    (Google Cloud Run / AWS)          │
├──────────────────────────────────────┤
│                                      │
│  Docker Container                    │
│  ├─ Python 3.10+                    │
│  ├─ FastAPI + uvicorn               │
│  ├─ APScheduler                      │
│  └─ Dependencies (requirements.txt)   │
│                                      │
│  Environment Variables               │
│  ├─ POST_FOR_ME_API_KEY             │
│  ├─ SUPABASE_URL                    │
│  ├─ SUPABASE_SERVICE_ROLE_KEY       │
│  └─ ANALYTICS_BATCH_SIZE=50         │
│                                      │
└──────────────────────────────────────┘
         ↓                    ↓
    ┌─────────────┐  ┌───────────────────┐
    │  Supabase   │  │  PostForMe API    │
    │  (Managed)  │  │  (Third-party)    │
    └─────────────┘  └───────────────────┘

Monitoring:
├─ Uptime Robot: /health endpoint
├─ Logs: Cloud Logging / Datadog
├─ Metrics: CPU/Memory/API calls
└─ Alerts: Slack on errors
```

---

This architecture provides:
- ✅ **Scalability** - Concurrent processing, batch operations
- ✅ **Reliability** - Error handling, graceful degradation
- ✅ **Maintainability** - Type safety, clear separation of concerns
- ✅ **Performance** - Optimized queries, efficient scheduling
- ✅ **Observability** - Comprehensive logging, monitoring
