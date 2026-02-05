# Automation Schedule Redesign - Quick Reference

## What Changed in 60 Seconds

✨ **Old way:** Select days, select times → same times for all days  
✨ **New way:** Each day has its own times

## Data Format

```typescript
// How it's stored in Supabase
{
  "monday": ["09:00", "14:00"],
  "tuesday": ["09:00"],
  "wednesday": [],
  ...
}
```

## UI Layout

```
┌─ Presets ─────────┐
│ [Quick Setup]     │
└───────────────────┘

┌─ Monday ──────────────┐
│ [9:00] [14:00]        │
│ [Time Grid]           │
└───────────────────────┘

┌─ Tuesday ─────────────┐
│ [9:00]                │
│ [Time Grid]           │
└───────────────────────┘

... (Wed, Thu, Fri, Sat, Sun)

┌─ Summary ─────────────┐
│ Mon: 9:00, 14:00      │
│ Tue: 9:00             │
│ Total: 3 posts/week   │
└───────────────────────┘
```

## How to Use

1. **Apply preset** → Click "Weekday Morning" (auto-fills all days)
2. **Customize** → Click any time in a day's grid to add/remove
3. **Review** → Summary shows exact schedule
4. **Submit** → Next step in wizard

## Files Changed

```
frontend/
├── src/components/automations/
│   ├── AutomationWizard.tsx (interface + validation)
│   └── steps/
│       └── AutomationWizardStep4.tsx (UI rewrite)
```

## Testing

```bash
# 1. Start dev
npm run dev

# 2. Create automation → Go to Step 4
# 3. Try presets
# 4. Add/remove times
# 5. Check summary updates in real-time
```

## Key Improvements

| Before | After |
|--------|-------|
| Same times all days | Different times per day |
| Limited flexibility | Full control |
| 2 checkbox groups | 7 intuitive cards |
| Manual calculation | Real-time summary |

## Presets Available

- **Weekday Morning**: Mon-Fri 09:00
- **Weekday Afternoon**: Mon-Fri 14:00
- **Daily Once**: Every day 09:00
- **Twice Daily**: Every day 09:00 + 18:00

## Behind the Scenes

✅ **Backend**: No changes (already supported)  
✅ **Database**: No schema changes (JSON field)  
✅ **API**: Schedule sent as-is to backend  
✅ **Build**: All 33 routes compile  

## Common Workflows

### Workflow 1: One Time Daily
1. Click "Daily Once" → All days 09:00

### Workflow 2: Weekdays vs Weekends
1. Click "Weekday Morning" (Mon-Fri 09:00)
2. Add Saturday 10:00, Sunday 10:00 manually

### Workflow 3: Multiple Posts Some Days
1. Click "Weekday Morning" (Mon-Fri 09:00)
2. Add Tuesday 14:00 (click in Tuesday's grid)
3. Add Friday 18:00 (click in Friday's grid)

### Workflow 4: No Posting on Certain Days
1. Apply any preset
2. Leave Saturday/Sunday empty
3. Summary shows only posting days

## Troubleshooting

**Q: Can't click Next on Step 4?**  
A: Need at least one time on any day. Set a time and try again.

**Q: Schedule looks wrong?**  
A: Check summary section - it shows exactly what will post.

**Q: Times showing in wrong timezone?**  
A: Uses `convertToLocalTime()` - check browser timezone settings.

**Q: Can't remove a time?**  
A: Click the X button next to the time chip, or click the time in the grid again.

## Before/After Example

```
BEFORE:
- Days: Monday, Tuesday, Wednesday, Thursday, Friday
- Times: 09:00, 14:00
- Result: All 5 days post at both 9am and 2pm
  (5 days × 2 times = 10 posts/week)

AFTER:
- Monday: 09:00, 14:00 (2 posts)
- Tuesday: 09:00 (1 post)
- Wednesday: 14:00, 17:00 (2 posts)
- Thursday: 09:00 (1 post)
- Friday: 09:00, 14:00 (2 posts)
- Saturday: (empty)
- Sunday: (empty)
  (8 posts/week, optimized per day)
```

## Next Run Calculation

Backend automatically calculates next run time based on schedule:

```
Today: Wednesday 08:00
Wednesday schedule: ["14:00", "17:00"]
Next run: Wednesday 14:00

Today: Wednesday 20:00
Next run: Thursday 09:00 (or whenever Thursday is scheduled)
```

## Performance

- ✅ No lag when adding/removing times
- ✅ Summary updates instantly
- ✅ Smooth preset application
- ✅ No extra API calls during editing
- ✅ Sends optimized JSON to backend

## Mobile Experience

- Cards stack vertically
- Time grid scrolls horizontally if needed
- Touch-friendly buttons
- Full functionality on mobile
- Same presets and features

## Validation Rules

✅ At least one time must be set somewhere  
✅ Times are sorted automatically  
✅ Can't duplicate a time on the same day  
✅ Times must be in HH:MM format (handled by UI)  
✅ Must select at least one template before scheduling  

## Support

For issues or questions:
1. Check `AUTOMATION_SCHEDULE_REDESIGN.md` for details
2. Check `AUTOMATION_SCHEDULE_UI_COMPARISON.md` for examples
3. Check this file for quick answers

---

**Status:** ✅ Ready for Testing  
**Build:** ✅ All routes compile  
**Backend:** ✅ No changes needed  
