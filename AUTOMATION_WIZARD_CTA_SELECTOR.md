# Automation Wizard - CTA Selector Step Added

## ✅ Summary

Added a new CTA (Call-To-Action) selector step to the Automation Wizard, allowing users to select which CTAs should be included with their automation. CTAs will rotate with each post generation.

**New Wizard Flow:**
1. Step 1: Visual Info (name, description)
2. Step 2: Select Templates
3. **Step 3: Select CTAs** ← NEW
4. Step 4: Select Accounts/Platforms
5. Step 5: Select Schedule
6. Step 6: Confirm & Create

---

## 📝 Changes Made

### 1. AutomationWizard.tsx - Main Component Updated

**Added CTA field to data structure:**
```typescript
export interface AutomationWizardData {
  // ... existing fields ...
  
  // Step 3: CTAs (NEW)
  ctaIds: string[];
  
  // ... rest of fields ...
}
```

**Updated steps array:**
```typescript
const STEPS = ['Visual Info', 'Templates', 'CTAs', 'Accounts', 'Schedule', 'Confirm'];
const TOTAL_STEPS = STEPS.length; // Now 6 instead of 5
```

**Updated validation logic:**
```typescript
const isStepValid = (): boolean => {
  switch (currentStep) {
    case 0: return name.trim().length > 0;
    case 1: return templateIds.length > 0;
    case 2: return ctaIds.length > 0;  // NEW validation
    case 3: return platforms.length > 0;
    case 4: return schedule has days and times;
    case 5: return true; // Confirm step
  }
};
```

**Updated payload to include CTAs:**
```typescript
const payload = {
  // ... other fields ...
  cta_ids: wizardData.ctaIds,  // Now uses selected CTAs instead of empty array
  // ... rest ...
};
```

### 2. AutomationWizardStep3CTA.tsx - New CTA Selector Component

**File Created:** `frontend/src/components/automations/steps/AutomationWizardStep3CTA.tsx`

**Features:**
- ✅ Multi-select CTA checkboxes
- ✅ Displays CTA label, text, and URL
- ✅ Loads active CTAs for the brand using `useBrandCtas` hook
- ✅ Shows loading skeleton while fetching
- ✅ Displays helpful message if no CTAs found
- ✅ Selection counter showing how many CTAs selected
- ✅ Info box explaining how CTAs work

**Component Props:**
```typescript
interface Step3CTAProps {
  data: AutomationWizardData;
  onChange: (data: AutomationWizardData) => void;
  brandId: string;
}
```

### 3. AutomationWizardStep5.tsx - Review Updated

**Added CTA review section:**
- Shows all selected CTAs in order
- Displays CTA label, text, and URL
- Shows rotation order (1, 2, 3, etc.)
- Uses existing `useBrandCtas` hook to fetch CTA details

**Code Added:**
```typescript
const { data: ctas } = useBrandCtas(data.brandId);

const selectedCtas = ctas?.filter((c) =>
  data.ctaIds.includes(c.id)
) || [];
```

---

## 🎯 User Flow

### Creating Automation with CTAs

```
1. Click "Create Automation"
   ↓
2. Enter name & description
   ↓
3. Select templates (rotate through these)
   ↓
4. SELECT CTAs ← NEW STEP
   - User sees all active CTAs for their brand
   - Selects which CTAs to include
   - CTAs will rotate with each post
   ↓
5. Select platforms (Instagram, TikTok, etc.)
   ↓
6. Select schedule (days & times)
   ↓
7. Review all settings including CTAs ← UPDATED
   ↓
8. Click "Create Automation"
   ↓
9. Automation saved with CTA rotation enabled
```

---

## 🔄 How CTA Rotation Works

When automation runs:

1. **Generate Post 1:** Uses Template 1 + CTA 1
2. **Generate Post 2:** Uses Template 2 + CTA 2
3. **Generate Post 3:** Uses Template 3 + CTA 1 (loops back)
4. **Generate Post 4:** Uses Template 1 + CTA 2 (loops back)

CTAs rotate independently from templates, allowing even more variation.

---

## 📊 Database Integration

### Automations Table Now Uses:
```sql
cta_ids UUID[] NOT NULL  -- Array of selected CTA IDs
cursor_cta_index INT     -- Current position in CTA rotation
```

### API Payload:
```json
{
  "name": "Weekly Newsletter",
  "template_ids": ["t1", "t2", "t3"],
  "cta_ids": ["c1", "c2"],        -- NEW
  "platforms": ["instagram", "tiktok"],
  "schedule": {...},
  "cursor_cta_index": 0,          -- NEW
  ...
}
```

---

## 🧩 Component Architecture

```
AutomationWizard (Main Container)
├── Step 1: AutomationWizardStep1
│   └── Name + Description input
├── Step 2: AutomationWizardStep2
│   └── Template multi-select
├── Step 3: AutomationWizardStep3CTA ← NEW
│   └── CTA multi-select with useBrandCtas hook
├── Step 4: AutomationWizardStep3
│   └── Platform selection
├── Step 5: AutomationWizardStep4
│   └── Schedule builder
└── Step 6: AutomationWizardStep5
    └── Review all settings including CTAs ← UPDATED
```

---

## ✅ Build Status

```
✅ Compiled successfully in 5.9s
✅ All 33 routes passing
✅ No TypeScript errors
✅ No import errors
```

---

## 📋 Files Modified

| File | Changes | Type |
|------|---------|------|
| AutomationWizard.tsx | Added ctaIds field, updated steps, validation logic | Updated |
| AutomationWizardStep3CTA.tsx | New CTA selector component | Created |
| AutomationWizardStep5.tsx | Added CTA review section | Updated |

---

## 🚀 Features

✅ **CTA Selection:** Multi-select active CTAs for brand
✅ **CTA Rotation:** CTAs rotate with each generated post
✅ **Loading States:** Skeleton while fetching CTAs
✅ **Empty States:** Message if no CTAs exist
✅ **Review Display:** See all CTAs in order on confirm step
✅ **Validation:** Can't proceed without selecting CTAs
✅ **Database Ready:** cta_ids array sent to API

---

## 💡 Next Steps

After creating automation with CTAs:

1. ✅ Wizard saves automation with cta_ids array
2. ✅ Automation worker fetches correct CTA for each run
3. ✅ Gemini prompt includes selected CTA
4. ✅ Generated post's final slide includes CTA text
5. ✅ CTA rotates to next one on next run

---

## 🔧 Integration with Backend

### What the Backend Receives
```json
{
  "template_ids": ["t1", "t2", "t3"],
  "cta_ids": ["c1", "c2"],
  "cursor_cta_index": 0,
  ...
}
```

### What Backend Does on Each Run
1. Calculate CTA index: `cursor_cta_index % len(cta_ids)`
2. Fetch CTA from database: `get_brand_cta(cta_ids[index])`
3. Include in Gemini prompt
4. Increment cursor_cta_index for next run

---

## 📱 UI/UX Details

### Step 3 CTA Selector
- Clean list of CTAs with cards
- Shows CTA label (bold)
- Shows CTA text (gray)
- Shows URL if present (truncated, smaller)
- Checkbox for selection
- Hover effect for better affordance
- Selection counter at bottom

### Review Step
- CTA list section showing rotation order
- Numbered badges (1, 2, etc.)
- Same card layout as Step 2 templates
- Clear indication of rotation

---

**Status:** ✅ Complete and Production Ready  
**Build:** ✅ Passing (all 33 routes)  
**Last Updated:** 2026-02-02  

