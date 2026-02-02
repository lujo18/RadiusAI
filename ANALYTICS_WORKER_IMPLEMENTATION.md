# Analytics Worker - Implementation Summary

## ✅ What's Complete

Your analytics worker is now **fully implemented and ready to use**. Here's what was built:

### 1. **PostForMe Analytics Models** 📊
- `backend/models/postforme_analytics.py`
  - `PostForMeMetrics` - Maps PostForMe metric fields
  - `PostForMeItem` - Single post from PostForMe API
  - `PostForMeAnalyticsResponse` - Full paginated response

### 2. **PostForMe Analytics Client** 🔌
- `backend/services/integrations/social/postforme/analytics_client.py`
  - Handles authentication with `Authorization: Bearer {API_KEY}`
  - Makes requests to `GET /v1/items?social_post_id=X&expand=["metrics"]`
  - Parses response with Pydantic validation
  - Returns `PostForMeAnalyticsResponse` or `None` on error

### 3. **Analytics Worker** ⚙️
- `backend/services/workers/analytics/analytic_worker.py`
  - `process_due_posts()` - Main cron job function
  - `fetch_platform_metrics()` - Calls PostForMe API
  - `process_single_post()` - Handles single post analytics collection
  
**Key Features:**
- Fetches posts where `next_collection_at ≤ now`
- Processes up to 50 posts per run (configurable `BATCH_SIZE`)
- Calls PostForMe using `external_post_id` as `social_post_id`
- Maps metrics: `favorites` → `saves`, `reach` → `impressions`
- Calculates `engagement_rate = (likes + comments + shares + saves) / impressions`
- Uses `upsert()` to update existing analytics or create new ones
- Updates `post_tracking_metadata` with next collection time based on post age

### 4. **Smart Collection Schedule** 📅
- **Hourly**: Posts ≤ 24h old
- **Daily**: Posts 1-7 days old
- **Weekly**: Posts 8-28 days old
- **Monthly**: Posts 29-90 days old
- **Stops**: Posts > 90 days old

### 5. **Scheduler Integration** 🚀
- `backend/main.py` - FastAPI lifespan management
  - Starts APScheduler on app startup
  - Runs `process_due_posts()` every 5 minutes
  - Gracefully shuts down on app close
  - Prevents overlapping runs with `max_instances=1`

### 6. **Analytics Service** 🛠️
- `backend/services/analytics_service.py`
  - `start_tracking_post_analytics()` - Manually start tracking
  - `get_post_analytics()` - Get latest metrics for a post
  - `get_post_tracking_metadata()` - Get collection schedule info
  - `get_brand_analytics_summary()` - Aggregated metrics for all brand posts

### 7. **Automatic Tracking on Publish** 📤
- `backend/services/integrations/supabase/db/post.py`
  - Updated `update_post_status()` to auto-call `create_analytic_tracker()`
  - When post status changes to "published", analytics tracking starts automatically
  - Next collection scheduled for 1 hour later

### 8. **Complete Type Safety** 🔒
- `backend/models/analytics.py`
  - `PostAnalyticsRecord` - Supabase post_analytics schema
  - All analytics operations use Pydantic models
  - Full type hints throughout the system

---

## 🔄 How It Works

### Workflow
```
1. Post Published
   └─> update_post_status("published")
       └─> Calls: create_analytic_tracker(post_id)
           └─> Creates row in post_tracking_metadata
               - next_collection_at = now + 1 hour
               - current_interval = "hourly"
               - collection_count = 0

2. Every 5 minutes (cron job)
   └─> process_due_posts()
       └─> Query: WHERE next_collection_at ≤ now (BATCH_SIZE=50)
           └─> For each post:
               1. Get external_post_id (pfm_post_id)
               2. POST→ GET /v1/items?social_post_id=X&expand=["metrics"]
               3. Extract metrics from response
               4. Upsert into post_analytics
               5. Calculate next interval based on age
               6. Update post_tracking_metadata with next run time

3. Repeat every 5 minutes with intelligent backoff
```

---

## 🔌 PostForMe API Integration

### Request
```bash
GET https://api.postforme.dev/v1/items
  ?social_post_id=sp_xxxxxx    # external_post_id from posts table
  &limit=1
  &expand=["metrics"]

Authorization: Bearer {POST_FOR_ME_API_KEY}
```

### Response
```json
{
  "data": [
    {
      "platform": "instagram",
      "social_post_id": "sp_...",
      "platform_post_id": "17999...",
      "metrics": {
        "likes": 42,
        "comments": 5,
        "shares": 0,
        "favorites": 12,        // Maps to: saves
        "reach": 1000           // Maps to: impressions
      }
    }
  ],
  "meta": {"cursor": null, "has_more": false}
}
```

### Metrics Mapping
| PostForMe Field | → Supabase Field |
|---|---|
| `likes` | `likes` |
| `comments` | `comments` |
| `shares` | `shares` |
| `favorites` | `saves` |
| `reach` | `impressions` |
| *(calculated)* | `engagement_rate` |

---

## 📊 Database Tables

### post_tracking_metadata (Schedule Info)
```sql
post_id TEXT PRIMARY KEY
current_interval TEXT ('hourly' | 'daily' | 'weekly' | 'monthly')
collection_count INTEGER
last_collected_at TIMESTAMP
next_collection_at TIMESTAMP  ← Triggers collection when ≤ NOW()
```

### post_analytics (Metrics Snapshot)
```sql
post_id TEXT PRIMARY KEY
likes INTEGER
comments INTEGER
shares INTEGER
saves INTEGER
impressions INTEGER
engagement_rate FLOAT
last_updated TIMESTAMP
```

---

## 🚀 Quick Start

### 1. Verify Setup
```bash
cd backend
# Check environment variables
echo $POST_FOR_ME_API_KEY
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

### 2. Start Backend
```bash
uvicorn backend.main:app --reload
# Should see: ✅ Analytics worker scheduler started (runs every 5 minutes)
```

### 3. Create and Publish a Post
```bash
# Via your API: POST /api/post/publish
# Or manually update in Supabase:
UPDATE posts 
SET status = 'published', published_time = NOW()
WHERE id = '...';
```

### 4. Verify Tracking Created
```sql
-- Should see new row in post_tracking_metadata
SELECT * FROM post_tracking_metadata 
WHERE post_id = '...';
-- next_collection_at should be ~1 hour from creation time
```

### 5. Force Collection (for testing)
```sql
-- Update next collection to NOW to force immediate processing on next cron
UPDATE post_tracking_metadata 
SET next_collection_at = NOW()
WHERE post_id = '...';

-- Wait 5 minutes, then check:
SELECT * FROM post_analytics WHERE post_id = '...';
```

### 6. View Logs
```
uvicorn output should show:
✅ INFO: Starting analytics worker at ...
ℹ️  INFO: Found X posts due for collection
ℹ️  INFO: Updated analytics for post ...
```

---

## 🔍 Debugging

### Check if post has external_post_id
```sql
SELECT id, external_post_id, status 
FROM posts 
WHERE id = '...'
-- external_post_id must not be NULL for analytics
```

### Check tracking schedule
```sql
SELECT 
  post_id,
  current_interval,
  next_collection_at,
  collection_count,
  (next_collection_at - NOW()) as time_until_next
FROM post_tracking_metadata
WHERE post_id = '...';
```

### Check analytics
```sql
SELECT * FROM post_analytics WHERE post_id = '...';
-- Should update with latest metrics each collection
```

### Check logs for errors
```bash
# In uvicorn terminal, search for ERROR:
# ERROR Error fetching metrics for post ...: {error}
# ERROR Error processing post ...: {error}
```

---

## 📝 Files Created/Modified

### New Files
- ✅ `backend/models/postforme_analytics.py` - PostForMe response models
- ✅ `backend/services/integrations/social/postforme/analytics_client.py` - PostForMe client
- ✅ `backend/services/analytics_service.py` - Analytics helper functions
- ✅ `ANALYTICS_WORKER_GUIDE.md` - Full documentation

### Modified Files
- ✅ `backend/services/workers/analytics/analytic_worker.py` - Main worker logic
- ✅ `backend/models/analytics.py` - Added PostAnalyticsRecord model
- ✅ `backend/services/workers/analytics/create_analytic_tracker.py` - Fixed imports
- ✅ `backend/services/integrations/supabase/db/post.py` - Auto-track on publish
- ✅ `backend/main.py` - Added scheduler integration

---

## ✨ Features

✅ **Automatic Analytics Collection** - Runs every 5 minutes  
✅ **PostForMe Integration** - Fetches metrics from social platforms  
✅ **Smart Scheduling** - Age-based collection frequency  
✅ **Type Safe** - Full Pydantic models and type hints  
✅ **Error Handling** - Graceful failures, comprehensive logging  
✅ **Auto-Track on Publish** - Tracking starts automatically  
✅ **Efficient** - Batch processing, concurrent requests  
✅ **Upsert Pattern** - Handles both new and existing analytics  

---

## 🎯 Next Steps

1. **Start uvicorn** and monitor logs
2. **Create a test post** and publish it
3. **Wait 5 minutes** for first collection
4. **Check post_analytics table** for metrics
5. **Monitor logs** for any ERROR messages

---

## 📚 Documentation

For complete details, see: [ANALYTICS_WORKER_GUIDE.md](ANALYTICS_WORKER_GUIDE.md)

Topics covered:
- Architecture & data flow
- Complete API integration
- Database schema
- Collection schedule logic
- Error handling & logging
- Testing procedures
- Performance considerations
- Troubleshooting guide
