# Analytics Worker Implementation Guide

## Overview

The analytics worker is a **FastAPI automated cron job** that collects post metrics from PostForMe API and stores them in the Supabase `post_analytics` table. It runs **every 5 minutes** and intelligently manages collection frequency based on post age.

## Architecture

### Components

1. **Analytics Worker** (`analytic_worker.py`)
   - Main cron job logic
   - Fetches posts due for collection
   - Calls PostForMe API
   - Updates analytics and tracking metadata

2. **PostForMe Analytics Client** (`postforme/analytics_client.py`)
   - HTTP client for PostForMe `/v1/items` endpoint
   - Handles authentication and error handling
   - Maps PostForMe response to Pydantic models

3. **Analytics Service** (`analytics_service.py`)
   - Helper functions for analytics operations
   - Used by routers/webhooks
   - Provides analytics aggregation

4. **Scheduler Integration** (`main.py`)
   - APScheduler background task
   - Runs worker every 5 minutes
   - Gracefully handles shutdown

## Data Flow

```
Post Published
    ↓
update_post_status("published") → create_analytic_tracker()
    ↓
post_tracking_metadata inserted
    ↓
[Every 5 minutes]
process_due_posts() → fetch posts where next_collection_at ≤ now
    ↓
For each post:
  1. Get external_post_id (pfm_post_id)
  2. Call PostForMe API: GET /v1/items?social_post_id=X&expand=["metrics"]
  3. Extract metrics from response
  4. Upsert into post_analytics table
  5. Calculate next collection time based on post age
  6. Update post_tracking_metadata
```

## Database Schema

### post_tracking_metadata
```sql
post_id: string (Primary Key)
current_interval: enum ('hourly' | 'daily' | 'weekly' | 'monthly')
collection_count: integer
last_collected_at: timestamp
next_collection_at: timestamp  -- Triggers new collection when ≤ now
```

### post_analytics
```sql
post_id: string (Primary Key)
likes: integer
comments: integer
shares: integer
saves: integer
impressions: integer
engagement_rate: float
last_updated: timestamp
```

## Collection Schedule

Posts follow an age-based collection strategy:

| Post Age | Interval | Max Frequency |
|----------|----------|---------------|
| ≤ 24h | **Hourly** | Every 1 hour |
| 1-7 days | **Daily** | Every 1 day |
| 7-28 days | **Weekly** | Every 7 days |
| 28-90 days | **Monthly** | Every 30 days |
| > 90 days | **Stopped** | No tracking |

This strategy prioritizes fresh data for new posts while being efficient for older content.

## PostForMe API Integration

### Request Format
```bash
GET https://api.postforme.dev/v1/items
  ?social_post_id=sp_xxxxxx
  &limit=1
  &expand=["metrics"]

Headers:
  Authorization: Bearer {POST_FOR_ME_API_KEY}
```

### Response Format
```json
{
  "data": [
    {
      "platform": "instagram",
      "social_post_id": "sp_xxxxxx",
      "external_post_id": null,
      "platform_post_id": "17999...",
      "platform_url": "https://instagram.com/p/...",
      "caption": "...",
      "metrics": {
        "likes": 42,
        "comments": 5,
        "shares": 0,
        "favorites": 12,
        "reach": 1000,
        "video_views": null,
        "new_followers": 2
      }
    }
  ],
  "meta": {
    "cursor": null,
    "limit": 1,
    "has_more": false
  }
}
```

### Mapping
| PostForMe Field | Supabase Field |
|-----------------|----------------|
| `likes` | `likes` |
| `comments` | `comments` |
| `shares` | `shares` |
| `favorites` | `saves` |
| `reach` | `impressions` |
| Calculated | `engagement_rate` = (likes + comments + shares + saves) / impressions |

## Models

### PostForMeMetrics
```python
class PostForMeMetrics(BaseModel):
    likes: int = 0
    comments: int = 0
    shares: int = 0
    favorites: int = 0
    reach: Optional[int] = 0
    video_views: Optional[int] = 0
    total_time_watched: Optional[int] = 0
    average_time_watched: Optional[float] = 0
    full_video_watched_rate: Optional[float] = 0
    new_followers: Optional[int] = 0
```

### PostForMeItem
```python
class PostForMeItem(BaseModel):
    platform: str
    social_post_id: Optional[str]
    external_post_id: Optional[str]
    platform_post_id: str
    social_account_id: str
    external_account_id: Optional[str]
    platform_account_id: str
    platform_url: str
    caption: str
    media: List[Dict[str, Any]] = []
    metrics: Optional[PostForMeMetrics] = None
```

## Implementation Details

### Fetching Metrics

```python
async def fetch_platform_metrics(post_id: str) -> dict:
    # 1. Get post from Supabase to find external_post_id
    # 2. Call PostForMe API with social_post_id
    # 3. Extract metrics from response
    # 4. Return mapped metrics dict
```

**Key Points:**
- Uses `external_post_id` as the `social_post_id` for PostForMe queries
- Returns empty dict on error (graceful failure)
- Handles missing metrics gracefully

### Processing Single Post

```python
async def process_single_post(track_row: dict, post_row: dict):
    # 1. Fetch metrics from PostForMe
    # 2. Calculate engagement_rate
    # 3. Upsert into post_analytics (update if exists)
    # 4. Determine next collection interval based on age
    # 5. Update post_tracking_metadata
```

**Important:**
- Uses `upsert()` to handle both new and existing analytics
- Gracefully handles missing `published_time` field
- Stops tracking when post is > 90 days old

### Error Handling

- All exceptions are caught and logged
- Worker continues processing other posts on error
- Failed analytics don't block post_tracking_metadata update
- Exceptions logged with stack trace for debugging

## Logging

The worker logs at INFO and ERROR levels:

```
✅ INFO: "Starting analytics worker at 2026-02-01T12:00:00+00:00"
ℹ️  INFO: "Found 5 posts due for collection"
ℹ️  INFO: "Updated analytics for post {post_id}"
ℹ️  INFO: "Updated tracking for post {post_id}: next collection in hourly (1:00:00)"
⚠️  WARNING: "Post {post_id} has no external_post_id (pfm_post_id)"
❌ ERROR: "Error fetching metrics for post {post_id}: {error}"
```

## Usage Examples

### Starting Analytics Tracking

When a post is published:
```python
# Automatically called by update_post_status()
await create_analytic_tracker(post_id)
```

### Getting Post Analytics

```python
from backend.services.analytics_service import get_post_analytics

analytics = get_post_analytics(post_id)
# Returns: {
#   "post_id": "...",
#   "likes": 42,
#   "comments": 5,
#   "shares": 0,
#   "saves": 12,
#   "impressions": 1000,
#   "engagement_rate": 0.059,
#   "last_updated": "2026-02-01T12:05:00+00:00"
# }
```

### Getting Brand Summary

```python
from backend.services.analytics_service import get_brand_analytics_summary

summary = get_brand_analytics_summary(brand_id)
# Returns: {
#   "brand_id": "...",
#   "total_posts": 15,
#   "total_likes": 1240,
#   "total_comments": 89,
#   "total_shares": 23,
#   "total_saves": 456,
#   "total_impressions": 15000,
#   "avg_engagement_rate": 0.0612
# }
```

## Testing

### Manual Testing

1. **Create a post and publish it:**
   ```bash
   # POST /api/post/publish
   # Post status changes to "published"
   # post_tracking_metadata is automatically created
   # next_collection_at set to 1 hour from now
   ```

2. **Force collection by updating next_collection_at:**
   ```bash
   # Update in Supabase SQL Editor:
   UPDATE post_tracking_metadata
   SET next_collection_at = NOW()
   WHERE post_id = '...'
   
   # Wait 5 minutes for next cron run
   # Check post_analytics table for new metrics
   ```

3. **View logs:**
   ```bash
   # In uvicorn terminal:
   # Should see INFO logs from analytics worker
   ```

### Unit Tests

```python
# Test PostForMe client
async def test_get_post_analytics():
    client = PostForMeAnalyticsClient()
    result = await client.get_post_analytics("sp_test_id")
    assert result is not None
    assert result.data[0].metrics is not None

# Test worker
async def test_process_single_post():
    # Mock Supabase and PostForMe
    # Verify metrics stored correctly
    # Verify tracking updated
```

## Performance Considerations

- **Batch Size:** 50 posts per cron run (configurable)
- **Concurrency:** Processes up to 50 posts in parallel with `asyncio.gather()`
- **API Rate Limits:** PostForMe typically allows 100+ req/min
- **Database Writes:** Upsert is atomic and efficient

**Optimization Tips:**
- Increase batch size if server can handle it
- Reduce cron frequency if API rate limits are hit
- Consider adding exponential backoff for API errors

## Troubleshooting

### Analytics Not Updating

1. **Check post_tracking_metadata exists:**
   ```sql
   SELECT * FROM post_tracking_metadata WHERE post_id = '...';
   ```

2. **Check next_collection_at hasn't passed:**
   ```sql
   SELECT next_collection_at, now() FROM post_tracking_metadata 
   WHERE post_id = '...';
   ```

3. **Check external_post_id is set:**
   ```sql
   SELECT external_post_id FROM posts WHERE id = '...';
   ```

4. **Check uvicorn logs for errors:**
   - Look for ERROR messages from analytics worker
   - Verify PostForMe API key is correct

### Worker Not Running

1. **Check scheduler is initialized:**
   ```bash
   # In uvicorn logs, should see:
   # ✅ Analytics worker scheduler started
   ```

2. **Verify APScheduler is installed:**
   ```bash
   pip list | grep apscheduler
   ```

3. **Check FastAPI lifespan is working:**
   - Restart uvicorn
   - Verify no errors on startup

## Future Enhancements

- [ ] Batch PostForMe API calls for multiple posts
- [ ] Webhook-triggered collection (if PostForMe supports it)
- [ ] Machine learning to predict optimal collection timing
- [ ] Analytics aggregation by platform/template
- [ ] Performance dashboard with time-series charts
- [ ] Automatic alerting for engagement anomalies

## Related Files

- `/backend/services/workers/analytics/analytic_worker.py` - Main worker
- `/backend/services/integrations/social/postforme/analytics_client.py` - PostForMe client
- `/backend/services/analytics_service.py` - Helper functions
- `/backend/models/analytics.py` - Analytics models
- `/backend/models/postforme_analytics.py` - PostForMe response models
- `/backend/main.py` - Scheduler integration
