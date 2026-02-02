# TimeBlock Component - Visual & Functional Guide

## Component Architecture

```
┌─────────────────────────────────────────────────────┐
│        PostingModal / CalendarTab                    │
│                                                       │
│  brandId: string                                    │
│  onTimeSelect: (date) => void                       │
└─────────────────┬───────────────────────────────────┘
                  │
                  ↓ useScheduledPosts(from, to, brandId)
                  │
┌─────────────────────────────────────────────────────┐
│     React Query Hook (usePosts.ts)                   │
│                                                       │
│  - Query Key: ['posts', 'scheduled', from, to, bid] │
│  - Calls: postApi.getScheduledPosts(from, to, bid)  │
│  - Cache: 30 seconds                                 │
└─────────────────┬───────────────────────────────────┘
                  │
                  ↓ postApi.getScheduledPosts(from, to, brandId)
                  │
┌─────────────────────────────────────────────────────┐
│     Supabase Query (postApi.ts)                      │
│                                                       │
│  SELECT * FROM posts                                │
│  WHERE user_id = current_user                       │
│    AND status = 'scheduled'                         │
│    AND brand_id = brandId  ← Filter by brand        │
│    AND scheduled_time >= from                       │
│    AND scheduled_time <= to                         │
│  ORDER BY scheduled_time ASC                        │
└─────────────────┬───────────────────────────────────┘
                  │
                  ↓ Returns: ScheduledPost[]
                  │
┌─────────────────────────────────────────────────────┐
│     TimeBlockScheduler Component                     │
│                                                       │
│  scheduledPosts: ScheduledPost[]                    │
│  selectedDateTime?: Date                             │
│  onTimeSelect: (date) => void                       │
│  brandId?: string                                    │
└─────────────────┬───────────────────────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
        ↓                    ↓
    For each day        For each hour (9-21)
        │                    │
        └─────────┬──────────┘
                  │
        Check: isTimeOccupied()
           ↓
        ├─ No post? → TimeBlock (clickable, blue highlight when selected)
        └─ Has post? → TimeBlock (disabled, red, shows post title)
```

---

## TimeBlock States

### 1. AVAILABLE (Clickable)
```
┌──────────────────┐
│ 14:00            │  ← Time
│                  │
│                  │  ← Empty space
└──────────────────┘

Style:
  - White/default background
  - Cursor: pointer
  - Hover: light gray
  - Border: default
  - Click: selects time → blue ring + bg
```

### 2. OCCUPIED (Disabled)
```
┌──────────────────┐
│ 15:00            │  ← Time (red text)
│ ● Scheduled      │  ← Red badge
│ "Subscribe to... │  ← Post preview
│ [truncated]      │     (red text)
└──────────────────┘

Style:
  - Red (#ff0000) background
  - Red border: 2px
  - Opacity: 50%
  - Cursor: not-allowed
  - NOT clickable
```

### 3. PAST (Disabled)
```
┌──────────────────┐
│ 09:00            │  ← Grayed out
│                  │
│                  │  ← Can't select past times
└──────────────────┘

Style:
  - Gray text
  - Opacity: 50%
  - Cursor: not-allowed
  - NOT clickable
```

### 4. SELECTED (Occupied)
Can't select occupied slots, so this state doesn't apply to them:
```
┌──────────────────┐
│ 16:00            │  ← Time
│                  │
│ [BLUE RING]      │  ← Selection indicator
└──────────────────┘

Style:
  - Blue ring-2
  - Primary color background
  - Primary/10 background opacity
```

---

## UI Layout Example

```
Navigation: [← Previous] Month Year [Next →]

Time    Mon 1/20    Tue 1/21    Wed 1/22    Thu 1/23    Fri 1/24    Sat 1/25    Sun 1/26
────────────────────────────────────────────────────────────────────────────────────────
09:00   [  ]        [  ]        [  ]        [  ]        [  ]        [  ]        [  ]
        Empty       Empty       Empty       Empty       Empty       Empty       Empty

10:00   [  ]        [🔴]        [  ]        [  ]        [  ]        [  ]        [  ]
        Empty       Scheduled   Empty       Empty       Empty       Empty       Empty
                    "Newsletter"

11:00   [  ]        [  ]        [  ]        [🔴]        [  ]        [  ]        [  ]
        Empty       Empty       Empty       Scheduled   Empty       Empty       Empty
                                            "Tips Post"

12:00   [  ]        [  ]        [  ]        [  ]        [  ]        [  ]        [  ]
        Empty       Empty       Empty       Empty       Empty       Empty       Empty

13:00   [  ]        [  ]        [  ]        [  ]        [  ]        [  ]        [  ]
        Empty       Empty       Empty       Empty       Empty       Empty       Empty

14:00   [  ]        [  ]        [  ]        [  ]        [  ]        [  ]        [  ]
        Empty       Empty       Empty       Empty       Empty       Empty       Empty

15:00   [  ]        [  ]        [🔴]        [  ]        [  ]        [  ]        [  ]
        Empty       Empty       Scheduled   Empty       Empty       Empty       Empty
                                "Campaign"

16:00   [  ]        [  ]        [  ]        [  ]        [  ]        [  ]        [  ]
        Empty       Empty       Empty       Empty       Empty       Empty       Empty

17:00   [  ]        [  ]        [  ]        [  ]        [🔴]        [  ]        [  ]
        Empty       Empty       Empty       Empty       Scheduled   Empty       Empty
                                                        "Video"

Legend:
[  ] = Available (white, clickable)
[🔴] = Occupied (red, disabled)
Grayed out = Past time (disabled)
```

---

## Data Structures

### ScheduledPost Type
```typescript
type ScheduledPost = {
  id: string;
  scheduled_time: string;  // ISO 8601 datetime
  content: {
    title?: string;
    caption?: string;
  };
};
```

### TimeBlockProps
```typescript
type TimeBlockProps = {
  date: Date;                    // Day of the slot
  hour: number;                  // Hour (9-21)
  isSelected: boolean;           // User selected this slot
  isOccupied: boolean;          // Has a scheduled post
  occupiedPost?: ScheduledPost;  // The scheduled post (if occupied)
  onClick: (date, hour) => void; // Selection handler
  disabled?: boolean;            // Disable clicking
};
```

---

## Interaction Flow

### User Selects Available Time Slot
```
User clicks on empty time block
    ↓
TimeBlock.onClick() fires
    ↓
!shouldDisable check passes
    ↓
handleTimeClick(date, hour)
    ↓
Creates DateTime: addHours(startOfDay(date), hour)
    ↓
onTimeSelect(selectedTime)
    ↓
Parent state updates: setSelectedDateTime(time)
    ↓
TimeBlockScheduler re-renders
    ↓
isTimeSelected() check now returns true for this slot
    ↓
TimeBlock renders with blue ring
```

### User Tries to Select Occupied Slot
```
User clicks on red/occupied time block
    ↓
TimeBlock.onClick() fires
    ↓
!shouldDisable check FAILS
    ↓
✗ onClick is NOT called
    ↓
Slot remains disabled
    ↓
User sees it's occupied with post title
```

---

## Date Range & Time Slots

### Coverage
- **Date Range**: 7 days by default (configurable via `viewDays` state)
- **Time Slots**: 9 AM to 9 PM (13 hourly slots)
- **Navigation**: Previous/Next week buttons

### Example
```
Monday 1/20 through Sunday 1/26
9:00, 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00, 17:00, 18:00, 19:00, 20:00, 21:00
```

---

## Occupancy Detection

### Algorithm
```typescript
isTimeOccupied(date: Date, hour: number) {
  const targetDateTime = addHours(startOfDay(date), hour);
  
  return scheduledPosts.some(post => {
    if (!post.scheduled_time) return false;
    const postTime = new Date(post.scheduled_time);
    
    // Check if within 1 hour window
    return Math.abs(postTime.getTime() - targetDateTime.getTime()) < 3600000;
  });
}
```

### Logic
- Converts post's `scheduled_time` to JavaScript Date
- Compares with target time slot
- Marks as occupied if within 1-hour window
- This handles times like 14:30 being in the 14:00 slot

---

## Brand Filtering

### Before (All Users' Posts)
```sql
SELECT * FROM posts
WHERE user_id = current_user
  AND status = 'scheduled'
```

### After (Brand-Specific Posts)
```sql
SELECT * FROM posts
WHERE user_id = current_user
  AND status = 'scheduled'
  AND brand_id = ?  ← Filter added
```

### Impact
- When switching brands: component fetches that brand's posts only
- Prevents seeing other brand's scheduled slots
- Prevents duplicate posting across brands

---

## Performance Considerations

### Caching
```typescript
queryKey: [...postKeys.scheduled, fromDate, toDate, brandId]
staleTime: 30 * 1000  // 30 seconds
```

- Different brand = different cache key
- Automatic refetch when switching brands
- Manual refetch every 30 seconds

### Query Efficiency
- Server-side filtering by brand (SQL `WHERE`)
- Date range filtering reduces result set
- Sorted by scheduled_time for UI rendering

---

## Error Handling

### Missing brandId
- Component still works
- Fetches all user's posts
- Useful for global calendar view

### No Scheduled Posts
- Empty array passed
- All time blocks available
- Component renders normally

### API Error
- Graceful degradation
- Calendar tab shows error message
- Falls back to showing empty slots

---

## Browser Rendering

### Responsive Grid
```css
grid-cols-8  /* 1 time label + 7 days */
gap-2        /* spacing between slots */
```

### Viewport
- Horizontal scroll on mobile
- Full 7-day view on desktop
- Adjustable via `viewDays` prop

---

## Integration Points

1. **PostingModal**: Schedule posts, see occupied slots
2. **CalendarTab**: View entire calendar with occupancy
3. **Brand Context**: Automatically filters by active brand
4. **useScheduledPosts Hook**: Fetches data with caching

