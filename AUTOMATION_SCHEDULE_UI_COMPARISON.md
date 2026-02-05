# Automation Schedule UI - Before & After

## Visual Comparison

### BEFORE: Grid-Based Selection
```
┌─ Quick Presets ─────────────────┐
│ [Weekday Morning] [Weekday Afte] │
│ [Daily]           [Twice Daily]  │
└─────────────────────────────────┘

┌─ Select Days of Week ───────────┐
│ ☐ Mon  ☐ Tue  ☐ Wed  ☐ Thu     │
│ ☐ Fri  ☐ Sat  ☐ Sun            │
└─────────────────────────────────┘

┌─ Select Time Slots ─────────────┐
│ ☐ 06:00  ☐ 07:00  ☐ 08:00     │
│ ☐ 09:00  ☐ 10:00  ☐ 11:00     │
│ ☐ 12:00  ☐ 13:00  ☐ 14:00     │
│ ... more times ...              │
│ ☐ 22:00  ☐ 23:00               │
└─────────────────────────────────┘

Problem: All selected times apply to ALL selected days
- Can't have different times for different days
- User must create multiple automations for varied schedules
```

### AFTER: Per-Weekday Cards
```
┌─ Quick Presets ─────────────────────┐
│ [Weekday Morning]  [Weekday Afte]   │
│ [Daily Once]       [Twice Daily]    │
└─────────────────────────────────────┘

┌─ Custom Schedule by Day ────────────┐
│                                     │
│ ╔═ Monday                      2 times ║
│ ║ [09:00 ✕] [14:00 ✕]                ║
│ ║ 06 07 08 09 10 11 12 13 14 15      ║
│ ║ 16 17 18 19 20 21 22 23            ║
│ ╚═════════════════════════════════════╝
│
│ ╔═ Tuesday                      1 time ║
│ ║ [09:00 ✕]                          ║
│ ║ 06 07 08 09 10 11 12 13 14 15      ║
│ ║ 16 17 18 19 20 21 22 23            ║
│ ╚═════════════════════════════════════╝
│
│ ╔═ Wednesday                  No times ║
│ ║ (empty)                             ║
│ ║ 06 07 08 09 10 11 12 13 14 15      ║
│ ║ 16 17 18 19 20 21 22 23            ║
│ ╚═════════════════════════════════════╝
│
│ ... (Thursday, Friday, Saturday, Sunday)
│
└─────────────────────────────────────┘

┌─ Schedule Summary ──────────────────┐
│ Monday:   09:00, 14:00              │
│ Tuesday:  09:00                     │
│ Wednesday: (no times)               │
│                                     │
│ Total posts per week: 3             │
└─────────────────────────────────────┘

Benefit: Each day has its own posting schedule
- Monday: 2 posts (9am, 2pm)
- Tuesday: 1 post (9am)
- Wednesday: No posts
- etc.
```

## Interaction Examples

### Scenario 1: Setting a Weekday Morning Schedule
**Before:**
1. Click "Weekday Morning" preset → Days: Mon-Fri, Time: 09:00
2. All weekdays post at 09:00
3. Weekends don't post (not selected)
4. To add afternoon posts? Must create another automation or manually select

**After:**
1. Click "Weekday Morning" preset → All days configured automatically
   - Mon-Fri: 09:00
   - Sat-Sun: (empty)
2. Want to add Tuesday afternoon post? Click "14:00" in Tuesday's grid
3. Schedule instantly updates: Monday stays 09:00, Tuesday becomes 09:00+14:00
4. Real-time summary shows all changes

### Scenario 2: Optimal Posting Times (Different for Each Day)
**Before:**
- Monday: 09:00 (peak audience)
- Tuesday: 13:00 (lunch break)
- Wednesday: 09:00 (back to normal)
- Thursday: 18:00 (evening content)
- Friday: 12:00 (early Friday)

Had to manage multiple automations or compromise with same times everywhere.

**After:**
1. Click "Weekday Morning" to start (all days 09:00)
2. Tuesday: Remove 09:00, add 13:00
3. Thursday: Remove 09:00, add 18:00
4. Friday: Remove 09:00, add 12:00
5. Saturday/Sunday: Keep empty

All in one automation! Perfect.

### Scenario 3: Content Calendar Planning
**Before:**
- "Morning daily posts" automation (all days 09:00)
- "Afternoon posts" automation (Mon/Wed/Fri 15:00)
- "Weekend special" automation (Sat/Sun 11:00)

3 separate automations to maintain and monitor.

**After:**
Single automation with full flexibility:
- Mon: 09:00, 15:00
- Tue: 09:00
- Wed: 09:00, 15:00
- Thu: 09:00
- Fri: 09:00, 15:00
- Sat: 11:00
- Sun: 11:00

One automation, clearer intent, easier to manage.

## Code Comparison

### Type Definition
**Before:**
```typescript
schedule: {
  weekday: string[];  // ["Monday", "Tuesday"]
  time: string[];     // ["09:00", "14:00"]
}
```

**After:**
```typescript
schedule: {
  monday: string[];    // ["09:00", "14:00"]
  tuesday: string[];   // ["09:00"]
  wednesday: string[]; // ["14:00", "17:00"]
  thursday: string[];  // ["09:00"]
  friday: string[];    // ["09:00", "14:00"]
  saturday: string[];  // []
  sunday: string[];    // []
}
```

### Validation Logic
**Before:**
```typescript
case 4: // Schedule
  return (
    wizardData.schedule.weekday.length > 0 &&
    wizardData.schedule.time.length > 0
  );
```

**After:**
```typescript
case 4: // Schedule
  const hasSchedule = Object.values(wizardData.schedule).some(
    (times) => Array.isArray(times) && times.length > 0
  );
  return hasSchedule;
```

### Event Handlers
**Before:**
```typescript
const toggleWeekday = (weekday: string) => {
  // Add/remove from weekday array
};

const toggleTime = (time: string) => {
  // Add/remove from time array
};
```

**After:**
```typescript
const addTimeToDay = (dayId: string, time: string) => {
  const current = data.schedule[dayId] || [];
  const updated = [...current, time].sort();
  // Update schedule[dayId] = updated
};

const removeTimeFromDay = (dayId: string, time: string) => {
  const current = data.schedule[dayId] || [];
  const updated = current.filter((t) => t !== time);
  // Update schedule[dayId] = updated
};
```

## User Journey

### Old Flow (Global Times)
```
Step 4: Schedule
├─ Select Days: [Mon, Tue, Wed, Thu, Fri]
├─ Select Times: [09:00, 14:00, 18:00]
└─ Result: 5 days × 3 times = 15 posts/week
  (Posts at SAME times every day)
```

### New Flow (Per-Day Times)
```
Step 4: Schedule
├─ Preset: [Weekday Morning] ← One-click setup
├─ Customize: Monday +14:00, Friday +18:00
├─ Review:
│  ├─ Mon: 09:00, 14:00
│  ├─ Tue: 09:00
│  ├─ Wed: 09:00
│  ├─ Thu: 09:00
│  ├─ Fri: 09:00, 18:00
│  └─ Total: 8 posts/week
└─ Clear visibility into exact schedule
```

## Accessibility & UX

### Improvements
- **Clearer semantics**: Each day is a distinct section (easy to scan)
- **Remove pattern**: Familiar X button for removing items
- **Color coding**: Primary color highlights selected times
- **Real-time feedback**: Changes reflected immediately in summary
- **Keyboard accessible**: Tab through days and times (via button states)
- **Visual hierarchy**: Day label + time count at top of card

### Considerations
- Cards might scroll longer on mobile → Design includes scrollable grid inside each card
- Time picker still uses grid (familiar pattern from calendars)
- Presets reduce complexity for common cases
- Summary section ensures transparency

## Performance

### Frontend
- No significant performance impact
- Same number of DOM elements (just reorganized)
- State management: Single `schedule` object instead of two arrays
- Re-renders only affected day card when time added/removed

### Backend
- No changes required ✅
- Already optimized for per-weekday format
- Same JSON size or smaller (no redundant data)

## Migration Notes

### For Users
No user action required. New automations use new format automatically.

For existing automations (if migrating data):
```javascript
// Old format → New format
const old = { weekday: ["Monday", "Tuesday"], time: ["09:00", "14:00"] };
const migrated = {
  monday: ["09:00", "14:00"],
  tuesday: ["09:00", "14:00"],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
};
```

### For Developers
- Update any UI that displays/edits automation schedules
- No backend code changes needed
- TypeScript will catch outdated references to `.weekday` or `.time`
- Migration script available if needed

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Flexibility** | Same times all days | Different times per day |
| **UI Complexity** | 2 checkbox groups | 7 cards with time grids |
| **User Actions** | Check days, check times | Click times on specific days |
| **Presets** | 4 basic presets | 4 presets, all customizable |
| **Visibility** | Implicit (must calculate) | Explicit summary |
| **Use Cases** | Limited | Unlimited |
| **Posts Per Week** | (days × times) | ∑(times per day) |
| **Backend Support** | Required changes | Already supported ✅ |
