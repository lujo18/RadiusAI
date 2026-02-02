# TimeBlock Component Update - Scheduled Posts Display

## Overview
Updated the TimeBlockScheduler component to display all scheduled posts for the active brand and automatically disable those time slots to prevent duplicate posting.

---

## Changes Made

### 1. **TimeBlockScheduler Component** 
**File**: `frontend/src/components/scheduling/TimeBlockScheduler.tsx`

#### Added `brandId` Prop
```typescript
type TimeBlockSchedulerProps = {
  selectedDateTime?: Date;
  onTimeSelect: (dateTime: Date) => void;
  scheduledPosts?: ScheduledPost[];
  brandId?: string;  // ← NEW
  className?: string;
};
```

#### Enhanced TimeBlock Visual Feedback
- Changed occupied time slot styling to be more prominent (red with darker border)
- Updated badge text from "Occupied" to "Scheduled" for clarity
- Made text color red to match occupied state
- Occupied time blocks now show in red (#ff0000) with darker borders

#### Auto-Disable Occupied Time Blocks
```typescript
const shouldDisable = disabled || isOccupied;  // ← NEW: Now disables if occupied
```

Time blocks that are:
- In the past, OR
- Already have scheduled posts

Are now completely disabled (opacity reduced, cursor shows not-allowed).

---

### 2. **PostingModal Component**
**File**: `frontend/src/components/modals/PostingModal.tsx`

#### Pass brandId to TimeBlockScheduler
```typescript
<TimeBlockScheduler
  selectedDateTime={selectedDateTime}
  onTimeSelect={setSelectedDateTime}
  brandId={brandId}  // ← NEW
  scheduledPosts={scheduledPosts?.filter(...) || []}
/>
```

#### Pass brandId to useScheduledPosts Hook
```typescript
const { data: scheduledPosts } = useScheduledPosts(fromDate, toDate, brandId);  // ← NEW: brandId passed
```

Now only fetches scheduled posts for the active brand.

---

### 3. **CalendarTab Component**
**File**: `frontend/src/components/Dashboard/CalendarTab.tsx`

#### Updated TimeBlockScheduler Usage
```typescript
<TimeBlockScheduler
  selectedDateTime={selectedDateTime}
  onTimeSelect={handleTimeSelect}
  brandId={brandId}  // ← NEW
  scheduledPosts={displayScheduledPosts?.filter(...) || []}
  className=""
/>
```

Ensures the calendar tab also shows brand-specific scheduled posts.

---

### 4. **postApi Service**
**File**: `frontend/src/lib/api/surface/postApi.ts`

#### Updated getScheduledPosts Function
```typescript
async getScheduledPosts(fromDate?: Date, toDate?: Date, brandId?: string) {  // ← NEW: brandId param
  const userId = await requireUserId();
  let query = supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'scheduled');

  if (brandId) {
    query = query.eq('brand_id', brandId);  // ← NEW: Filter by brand
  }

  if (fromDate) {
    query = query.gte('scheduled_time', fromDate.toISOString());
  }
  if (toDate) {
    query = query.lte('scheduled_time', toDate.toISOString());
  }

  query = query.order('scheduled_time', { ascending: true });

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}
```

Now filters Supabase query by `brand_id` when provided.

---

### 5. **useScheduledPosts Hook**
**File**: `frontend/src/lib/api/hooks/usePosts.ts`

#### Updated Hook Implementation
```typescript
export function useScheduledPosts(fromDate?: Date, toDate?: Date, brandId?: string) {
  return useQuery({
    queryKey: fromDate && toDate ? [...postKeys.scheduled, fromDate.toISOString(), toDate.toISOString(), brandId] : [...postKeys.scheduled, brandId],
    queryFn: () => postApi.getScheduledPosts(fromDate, toDate, brandId),  // ← Now passes brandId
    staleTime: 30 * 1000,
    retry: 1,
    retryDelay: 1000,
  });
}
```

Now properly passes `brandId` to the API layer.

---

## Data Flow

```
PostingModal / CalendarTab
    ↓
useScheduledPosts(fromDate, toDate, brandId)
    ↓
postApi.getScheduledPosts(fromDate, toDate, brandId)
    ↓
Supabase Query:
  SELECT * FROM posts
  WHERE user_id = current_user
    AND status = 'scheduled'
    AND brand_id = brandId
    AND scheduled_time >= fromDate
    AND scheduled_time <= toDate
  ORDER BY scheduled_time ASC
    ↓
TimeBlockScheduler displays posts
    ↓
For each time slot:
  - Check if any scheduled post exists
  - If yes: Show post title, disable slot (red styling)
  - If no: Show empty, allow selection
```

---

## User Experience Changes

### Before
- ❌ Scheduled posts were shown but time blocks weren't disabled
- ❌ Users could accidentally schedule multiple posts at same time
- ❌ Visual indication was subtle (light red background)

### After
- ✅ Scheduled posts display prominently in red
- ✅ Time blocks with existing posts are completely disabled (can't click)
- ✅ Clear visual distinction between available and occupied slots
- ✅ Only shows posts for the currently active brand
- ✅ Prevents duplicate posting at same time

---

## Visual Styling

### Available Time Slot
- Background: White/Light (default)
- Cursor: Pointer (clickable)
- Hover: Light gray background
- Ring: Blue ring when selected

### Occupied Time Slot
- Background: Red (#ffcccc)
- Border: Red (#ff0000) - 2px
- Text: Red (#dc2626)
- Badge: Red background
- Cursor: Not-allowed (disabled)
- Opacity: 50% (grayed out)

### Show Content
- Post title/caption preview
- "Scheduled" badge
- Time slot clearly marked as unavailable

---

## Testing Checklist

- [ ] Open PostingModal in a brand with scheduled posts
- [ ] Verify scheduled time blocks appear in red
- [ ] Verify can click on empty time blocks
- [ ] Verify **cannot** click on occupied time blocks (disabled)
- [ ] Verify only posts for active brand are shown
- [ ] Test with multiple brands - each shows own posts
- [ ] Check CalendarTab displays correct brand posts
- [ ] Verify 30-day window works correctly
- [ ] Test past time slots are disabled (grayed out)

---

## Notes

- The `brandId` parameter is optional throughout the stack - code gracefully handles missing brandId
- Scheduled posts are filtered server-side (in Supabase query) for performance
- React Query cache key includes `brandId`, so switching brands will refetch
- Occupied time slots use same disabled styling as past time slots
- Component prevents both past AND occupied slots from being selectable

---

## Build Status

✅ **Frontend Build**: Compiled successfully
- No TypeScript errors
- All changes integrated
- Ready for testing

