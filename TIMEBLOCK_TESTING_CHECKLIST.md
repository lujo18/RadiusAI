# TimeBlock Component - Testing Checklist

## Pre-Testing Setup

- [ ] Start frontend dev server: `cd frontend && npm run dev`
- [ ] Open browser to `http://localhost:3000`
- [ ] Ensure you're logged in
- [ ] Ensure you have an active brand selected
- [ ] Ensure that brand has at least 2 scheduled posts in different time slots

---

## Test 1: Basic Rendering

### Expected Behavior
- Calendar grid renders with 7 days (Mon-Sun)
- Time slots from 9 AM to 9 PM visible (13 slots)
- Time labels on left side (9:00, 10:00, etc.)
- Date headers at top (Mon 1/20, Tue 1/21, etc.)

### Steps
1. Navigate to Posting Modal or Dashboard Calendar tab
2. Check that grid displays correctly
3. Verify all time slots are visible
4. Check date navigation works (Previous/Next buttons)

### Result
- [ ] Grid renders correctly
- [ ] All time slots visible
- [ ] Navigation works

---

## Test 2: Occupied Slots Display

### Expected Behavior
- Scheduled posts appear in red
- Occupied slots show:
  - Red background (#ff0000)
  - Red border (2px)
  - Red text for time
  - "Scheduled" badge in red
  - Post title/preview (first ~30 chars)
- Opacity reduced to 50% (slightly faded)

### Steps
1. Look at time blocks for scheduled posts
2. Verify red styling is applied
3. Check post title is visible in slot
4. Check "Scheduled" badge appears
5. Compare with empty slots (should be noticeably different)

### Result
- [ ] Occupied slots are clearly RED
- [ ] Post title visible
- [ ] Badge shows "Scheduled"
- [ ] Clear visual distinction from empty slots

---

## Test 3: Occupied Slots Are Disabled

### Expected Behavior
- Clicking on occupied (red) slots does nothing
- Cursor should be `not-allowed` when hovering
- No selection highlight (blue ring)
- No state change

### Steps
1. Hover over occupied time slot
2. Check cursor changes to `not-allowed`
3. Click on occupied slot
4. Verify nothing happens
5. Click on empty slot nearby
6. Verify empty slot selects correctly (blue ring appears)

### Result
- [ ] Occupied slots not clickable
- [ ] Cursor shows "not-allowed"
- [ ] No selection happens
- [ ] Empty slots still work

---

## Test 4: Brand Filtering

### Expected Behavior
- Different brands show different occupied slots
- Switching brands refetches scheduled posts
- Only current brand's posts shown

### Steps
1. Note which time slots are occupied for Brand A
2. Switch to Brand B in brand selector
3. Observe new occupied slots for Brand B
4. Verify Brand A's occupied slots are NOT shown for Brand B
5. Switch back to Brand A
6. Verify original occupied slots return

### Result
- [ ] Brand A slots different from Brand B
- [ ] No cross-brand post visibility
- [ ] Correct posts shown per brand
- [ ] Switch doesn't cause errors

---

## Test 5: Empty Brand

### Expected Behavior
- Brand with no scheduled posts shows all available slots
- All slots are clickable
- No red slots appear

### Steps
1. Create a new brand with no posts
2. Navigate to scheduling
3. Verify all time slots are empty (white)
4. Verify all slots are clickable
5. Click on random slot
6. Verify it selects (blue ring appears)

### Result
- [ ] Empty brand has no red slots
- [ ] All slots clickable
- [ ] Selection works normally

---

## Test 6: Multiple Posts Same Day

### Expected Behavior
- Multiple posts on same day show in different time slots
- Each occupied slot is independently disabled
- Empty slots between them remain clickable

### Steps
1. Create 3 posts on same day: 10:00, 14:00, 18:00
2. Navigate to calendar
3. Verify all 3 slots show red
4. Verify 11:00-13:00 and 15:00-17:00 are empty and clickable
5. Click on 11:00 (between posts)
6. Verify it selects

### Result
- [ ] All 3 posts visible in red
- [ ] Empty slots between them clickable
- [ ] No false positive occupancy

---

## Test 7: Past Time Slots

### Expected Behavior
- Past time slots (before current time) are grayed out
- Past slots disabled regardless of occupancy
- Cursor shows "not-allowed"

### Steps
1. Look at today's earlier hours (e.g., 9:00 AM if it's noon)
2. Verify they appear grayed/faded
3. Hover - cursor should be "not-allowed"
4. Click - nothing should happen
5. Even if no post scheduled there

### Result
- [ ] Past slots are disabled
- [ ] Visual difference from available
- [ ] Can't click past slots

---

## Test 8: Selection Behavior

### Expected Behavior
- Only available slots selectable
- Selected slot shows blue ring
- Clicking again deselects
- Moving to different slot deselects previous

### Steps
1. Click on empty slot at 16:00
2. Verify blue ring appears around that slot
3. Click on different empty slot at 17:00
4. Verify 16:00 ring disappears
5. Verify 17:00 ring appears
6. Click same slot again (17:00)
7. Verify ring disappears (deselected)

### Result
- [ ] Selection shows blue ring
- [ ] Only one slot selected at a time
- [ ] Can deselect by clicking again
- [ ] Occupied slots never selectable

---

## Test 9: Date Range Changes

### Expected Behavior
- Clicking "Next" shows next 7 days
- Clicking "Previous" shows previous 7 days
- Occupied slots persist across week changes
- Date headers update correctly

### Steps
1. Note current week dates and occupied slots
2. Click "Next" button
3. Verify dates are +7 days
4. Verify occupied slots are correct for this week
5. Click "Previous" twice
6. Verify back to original week
7. Verify original occupied slots return

### Result
- [ ] Navigation works correctly
- [ ] Dates update properly
- [ ] Occupied slots match week
- [ ] No date off-by-one errors

---

## Test 10: Performance (React Query Cache)

### Expected Behavior
- First load fetches data (~100ms)
- Subsequent navigations use cache
- Switching brands triggers new fetch (new cache key)
- Manual refetch updates immediately

### Steps
1. Open DevTools → Network tab
2. Navigate to calendar
3. Watch for API call to `getScheduledPosts`
4. Switch to different brand
5. Verify new API call fires
6. Switch back to original brand
7. Verify NO new API call (cache hit)
8. Note smaller cache than initial call

### Result
- [ ] Initial data loads
- [ ] Brand switch triggers new fetch
- [ ] Going back uses cache
- [ ] No duplicate requests

---

## Test 11: Browser Resize

### Expected Behavior
- Calendar remains readable on mobile
- Grid remains visible on desktop
- No broken layout
- Horizontal scroll on very small screens

### Steps
1. Open PostingModal on desktop
2. Resize browser to mobile width (375px)
3. Verify time slots still visible
4. Verify dates visible
5. Check if horizontal scroll needed
6. Resize back to desktop (1920px)
7. Verify full layout

### Result
- [ ] Mobile view works
- [ ] Desktop view works
- [ ] No layout breaks
- [ ] Content remains readable

---

## Test 12: Error Scenario - API Fails

### Expected Behavior
- Error message displays in calendar
- Fallback behavior (show empty slots)
- Can still interact with component
- User knows what happened

### Steps
1. Open browser DevTools → Network
2. Throttle network to "Offline"
3. Refresh component
4. Observe error handling
5. Restore network
6. Refresh
7. Verify data loads again

### Result
- [ ] Error message appears
- [ ] Graceful degradation
- [ ] Can retry after fixing network
- [ ] No hard crash

---

## Test 13: Mobile Posting Flow

### Expected Behavior
- On mobile, can still see occupied slots
- Can select available slots
- Posting flow works normally

### Steps
1. Open on mobile device or mobile emulator
2. Navigate to Posting Modal
3. Observe TimeBlock component
4. Click on available slot
5. Proceed with posting
6. Verify post schedules

### Result
- [ ] Component usable on mobile
- [ ] Selection works
- [ ] Posting succeeds

---

## Edge Cases (Advanced)

### Edge Case 1: Same Hour Two Posts
**Setup**: Create two posts at 14:30 and 14:45 (both in 14:00 slot)
- [ ] 14:00 slot shows as occupied (both within 1-hour window)
- [ ] Either post title could show (whichever `getOccupiedPost` finds)

### Edge Case 2: Post at Exact Hour Boundary
**Setup**: Create post at exactly 15:00:00
- [ ] 15:00 slot shows as occupied
- [ ] Post visible in correct slot

### Edge Case 3: Daylight Saving Time
**Setup**: DST transition week
- [ ] Hours still align correctly
- [ ] No skipped/duplicate hours
- [ ] Posts still at correct times

### Edge Case 4: Timezone Mismatch
**Setup**: Post scheduled in different timezone
- [ ] Server converts to user's timezone
- [ ] Slot shows correct local time
- [ ] Database stores UTC

---

## Regression Tests (Compare Before/After)

- [ ] Creating new post still works
- [ ] Publishing posts still works
- [ ] Analytics still updates
- [ ] Multiple brand posting works
- [ ] A/B testing still functional
- [ ] Post cloning still works

---

## Sign-Off Checklist

### Core Functionality
- [ ] Occupied slots render in red
- [ ] Occupied slots are disabled/not clickable
- [ ] Brand filtering works
- [ ] Different brands show different occupied slots
- [ ] Clicking empty slot selects it
- [ ] Clicking occupied slot does nothing

### UX/Visual
- [ ] Red styling is clear and obvious
- [ ] Post titles visible in slots
- [ ] "Scheduled" badge present
- [ ] Accessibility: color-blind friendly?
- [ ] Mobile responsive

### Data Integrity
- [ ] No duplicate posts created
- [ ] Posts save to correct times
- [ ] Brand isolation maintained
- [ ] RLS policies enforced

### Performance
- [ ] Calendar loads quickly (<500ms)
- [ ] Switching brands is smooth
- [ ] No memory leaks
- [ ] Caching works correctly

---

## Known Limitations

- Occupied slots show only post title (first 30 chars)
- Hover tooltip showing full title not yet implemented
- 1-hour occupancy window is fixed (might be too broad)
- Can't see occupied slots for other users' posts (privacy correct)
- No visual indicator for "almost available" slots

---

## Next Steps After Testing

1. **If all tests pass**:
   - Feature ready for production
   - Create PR with feature branch
   - Request code review

2. **If issues found**:
   - Document issue type: Visual / Functional / Performance
   - Provide reproduction steps
   - Create GitHub issue
   - Fix and retest

3. **Future Enhancements**:
   - Add hover tooltip with full post details
   - Add post count indicator (e.g., "3 posts this day")
   - Configurable occupancy window
   - Visual indicator for "2 hours until next post"
