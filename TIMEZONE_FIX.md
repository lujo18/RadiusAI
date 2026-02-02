# TimeBlock Timezone Fix - January 30, 2026

## Problem
Post scheduled for `2026-01-31 20:00:00+00` (UTC) = `2026-01-31 14:00:00` CST (UTC-6)
- **Expected**: Post appears in the 14:00 time block
- **Actual**: Post was NOT showing (timezone mismatch)

## Root Cause
The `isTimeOccupied()` and `getOccupiedPost()` functions in TimeBlockScheduler.tsx were comparing times using `.getTime()` which doesn't account for timezone differences:

```typescript
// ❌ OLD - Broken (not timezone-aware)
const postTime = new Date(post.scheduled_time); // UTC time
const targetDateTime = addHours(startOfDay(date), hour); // Local timezone
return Math.abs(postTime.getTime() - targetDateTime.getTime()) < 3600000; // Different timezones!
```

The issue: 
- `postTime` from database: `2026-01-31 20:00:00 UTC`
- `targetDateTime` for 14:00 slot: `2026-01-31 14:00:00 CST` (but created in local context)
- When converted to `.getTime()` milliseconds, they don't match because one is UTC and one is local

## Solution
Convert the UTC database time to the user's local timezone BEFORE comparing:

```typescript
// ✅ NEW - Timezone-aware
const postTime = new Date(post.scheduled_time); // UTC from DB
const postHour = postTime.getHours(); // Get hour in LOCAL timezone (JS converts automatically)
const postDate = new Date(postTime.getFullYear(), postTime.getMonth(), postTime.getDate()); // Local date

const isSameLocalDay = postDate.toDateString() === date.toDateString();
const isWithinHour = Math.abs(postHour - hour) === 0;

return isSameLocalDay && isWithinHour;
```

**Key insight**: When you create a `Date` object from a UTC ISO string and call `.getHours()`, JavaScript **automatically converts to the user's local timezone**.

## JavaScript Timezone Behavior

```javascript
// Example: User in CST (UTC-6)
const utcTime = new Date("2026-01-31T20:00:00Z"); // 20:00 UTC
console.log(utcTime.getHours()); // Outputs: 14 (2 PM CST) ✅

// The Date object automatically adjusts for your timezone!
```

## Files Modified
- `frontend/src/components/scheduling/TimeBlockScheduler.tsx`
  - Updated `isTimeOccupied()` function (lines ~88-103)
  - Updated `getOccupiedPost()` function (lines ~108-120)

## Testing

### Before Fix
```
User timezone: CST (UTC-6)
Post in DB: 2026-01-31 20:00:00+00 UTC
Post time slot: 14:00 CST
Status: ❌ NOT showing in TimeBlock
```

### After Fix
```
User timezone: CST (UTC-6)
Post in DB: 2026-01-31 20:00:00+00 UTC
Post time slot: 14:00 CST
Status: ✅ SHOWING in red in 14:00 block
```

## Build Status
✅ **Compiled successfully in 9.3s** (zero errors)

## How to Test
1. Start dev server: `npm run dev`
2. Navigate to Posting Modal or Calendar Tab
3. Look for your post at `2026-01-31 14:00` (should show in RED)
4. Try clicking: should be disabled (can't select)
5. Switch to different date: post should disappear
6. Switch to different brand: post might disappear (if different brand)

## Edge Cases Handled
- ✅ UTC to local timezone conversion automatic in JavaScript
- ✅ Handles daylight saving time changes (JS Date object handles this)
- ✅ Works across month/year boundaries
- ✅ Works in any timezone (CST, EST, PST, etc.)

## Why This Works

JavaScript's `Date` object is smart:
1. When you parse a UTC ISO string like `"2026-01-31T20:00:00Z"`, it creates a Date in UTC
2. When you call methods like `.getHours()`, `.getDate()`, etc., it **automatically converts to your local timezone**
3. This is why `.getHours()` on a UTC date returns the local hour

Before: We were comparing milliseconds (mixing UTC and local)  
After: We compare the actual hour and date after timezone conversion

## Related Code
- Component: `frontend/src/components/scheduling/TimeBlockScheduler.tsx`
- Type: `type ScheduledPost = { scheduled_time: string; ... }`
- Database: Posts stored with `scheduled_time` in UTC (ISO 8601 format)

