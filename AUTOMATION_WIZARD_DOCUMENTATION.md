# Automation Wizard Component Documentation

## Overview

The **AutomationWizard** is a multi-step modal component that guides users through creating content automations. It uses a step-by-step interface with progress tracking, validation, and integrated form handling.

**Location:** `frontend/src/components/automations/`

## Component Structure

```
AutomationWizard.tsx (Main wizard container)
├── steps/
│   ├── AutomationWizardStep1.tsx (Visual Info)
│   ├── AutomationWizardStep2.tsx (Select Templates)
│   ├── AutomationWizardStep3.tsx (Select Platforms)
│   ├── AutomationWizardStep4.tsx (Configure Schedule)
│   └── AutomationWizardStep5.tsx (Review & Confirm)
```

## Features

✅ **5-Step Process**
- Step 1: Define automation name and description
- Step 2: Select templates to rotate
- Step 3: Choose social media platforms
- Step 4: Set posting schedule
- Step 5: Review and create

✅ **Navigation**
- Previous/Next buttons with validation
- Progress bar showing current step
- Can only proceed when current step is valid
- Cancel button to close wizard

✅ **Validation**
- Name required (Step 1)
- At least one template (Step 2)
- At least one platform (Step 3)
- Days and times required (Step 4)

✅ **Integration**
- Uses `useCreateAutomation()` hook for submission
- Automatic loading state management
- Success callback support
- Error handling

## Usage

### Basic Implementation

```typescript
import { AutomationWizard } from '@/components/automations/AutomationWizard';

function AutomationManager() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Create Automation
      </button>

      <AutomationWizard
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        brandId="brand-123"
        onSuccess={() => {
          console.log('Automation created!');
        }}
      />
    </>
  );
}
```

### Props

```typescript
interface AutomationWizardProps {
  isOpen: boolean;           // Modal visibility
  onOpenChange: (open: boolean) => void;  // Modal state handler
  brandId: string;           // Brand ID (required)
  onSuccess?: () => void;    // Callback after successful creation
}
```

## Step Details

### Step 1: Visual Info

**Purpose:** Define automation metadata

**Inputs:**
- **Automation Name** (required)
  - Text input, minimum 1 character
  - Clear, unique identifier for the automation
  
- **Description** (optional)
  - Textarea for notes about the automation
  - Helps team remember the purpose and strategy

**Validation:**
- Name must not be empty

**UI Elements:**
- Input field with placeholder
- Help text below each field
- Next steps preview box

---

### Step 2: Select Templates

**Purpose:** Choose content templates to rotate

**Features:**
- Displays all brand templates
- Checkbox selection for multiple templates
- Loading skeleton while fetching templates
- Shows template category and status
- Selected count summary

**Validation:**
- Must select at least 1 template

**UI Elements:**
- Template list with checkboxes
- Category and status badges
- Selection summary box
- Tips about template rotation

---

### Step 3: Select Accounts

**Purpose:** Choose which social media platforms to post to

**Platforms Available:**
- 📷 Instagram (carousel posts)
- 🎵 TikTok (vertical videos)
- 👥 Facebook (page posts)
- 💼 LinkedIn (professional content)

**Features:**
- Grid layout with 2 columns on desktop
- Icon + name + description for each platform
- Checkbox selection
- Selected platforms summary

**Validation:**
- Must select at least 1 platform

**UI Elements:**
- Platform cards with icons
- Description text
- Selection summary showing chosen platforms

---

### Step 4: Configure Schedule

**Purpose:** Set posting times and frequency

**Features:**
- **Preset Schedules:**
  - Weekday Morning (M-F @ 9:00 AM)
  - Weekday Afternoon (M-F @ 2:00 PM)
  - Daily (Every day @ 9:00 AM)
  - Twice Daily (Every day @ 9:00 AM & 6:00 PM)

- **Custom Schedule:**
  - Select individual weekdays
  - Select multiple time slots
  - Visual summary of total posts per week

**Validation:**
- Must select at least 1 day
- Must select at least 1 time

**UI Elements:**
- Preset buttons (quick selection)
- Day checkboxes (7 total)
- Time slot grid (18 slots: 6 AM to 11 PM)
- Scrollable time list
- Schedule summary box with post count

---

### Step 5: Review & Confirm

**Purpose:** Review all settings before creation

**Displays:**
- Automation name
- Description (if provided)
- Selected templates (with rotation order)
- Selected platforms
- Schedule details
- Total posts per week
- Next run date/time

**Features:**
- Read-only review of all settings
- Template list showing order (1, 2, 3...)
- Platform badges
- Complete schedule breakdown
- Information about what happens after creation

**Button:**
- "Create Automation" - submits the wizard
- Loading state while creating
- Closes wizard on success

## Data Flow

```
Step 1: Set Name & Description
       ↓
Step 2: Select Templates
       ↓
Step 3: Select Platforms
       ↓
Step 4: Set Schedule
       ↓
Step 5: Review All
       ↓
Submit → useCreateAutomation() hook
       ↓
Success: Close wizard, call onSuccess()
```

## State Management

### WizardData Interface

```typescript
interface AutomationWizardData {
  // Step 1
  name: string;
  description: string;

  // Step 2
  templateIds: string[];

  // Step 3
  platforms: Array<'instagram' | 'tiktok' | 'facebook' | 'linkedin'>;

  // Step 4
  schedule: {
    weekday: string[]; // ['Monday', 'Friday', etc]
    time: string[];    // ['09:00', '14:00', etc]
  };
  nextRunAt: string;
}
```

### State Updates

Each step updates the wizard data:

```typescript
const [wizardData, setWizardData] = useState<AutomationWizardData>({...});

// Step 1
onChange({ ...data, name: value })

// Step 2
onChange({ ...data, templateIds: [...] })

// Step 3
onChange({ ...data, platforms: [...] })

// Step 4
onChange({ ...data, schedule: {...} })
```

## Integration with Hooks

### useCreateAutomation Hook

The wizard uses the `useCreateAutomation()` hook for submission:

```typescript
const { mutate: createAutomation, isPending } = useCreateAutomation();

createAutomation(
  { brandId, payload },
  {
    onSuccess: () => {
      // Handle success
      onOpenChange(false);
    },
    onError: (error) => {
      // Handle error
    }
  }
);
```

### Loading States

- Button shows "Creating..." while pending
- Next button disabled during submission
- Progress bar shows current step

## Customization

### Modify Preset Schedules

Edit in `AutomationWizardStep4.tsx`:

```typescript
const presetSchedules = [
  { 
    name: 'Custom Name',
    weekdays: ['Monday', 'Friday'],
    times: ['09:00', '18:00']
  },
  // Add more presets
];
```

### Change Platforms

Edit in `AutomationWizardStep3.tsx`:

```typescript
const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', ... },
  // Add or remove platforms
];
```

### Adjust Time Slots

Edit in `AutomationWizardStep4.tsx`:

```typescript
const TIME_SLOTS = [
  '06:00', '07:00', ... '23:00'
  // Adjust available hours
];
```

## Accessibility

✅ **Features:**
- Checkbox components with proper labels
- Input fields with associated labels
- Dialog closes with Escape key
- Focus management
- Keyboard navigation support
- Progress indicator for screen readers

## Styling

Uses Tailwind CSS with these patterns:

**Color Classes:**
- `bg-primary/5` - Soft primary background
- `border-primary/20` - Soft primary border
- `text-primary` - Primary text
- `bg-foreground/5` - Subtle background

**Interactive States:**
- `:hover:bg-foreground/5` - Hover background
- `:focus-visible` - Focus rings (from shadcn inputs)
- `opacity-50 pointer-events-none` - Disabled state

**Layout:**
- `grid grid-cols-2` - Multi-column layouts
- `flex items-center gap-3` - Flex layouts
- `space-y-4` - Vertical spacing

## Error Handling

The component automatically:
- Catches submission errors via hook's error handler
- Shows loading state during submission
- Clears form and closes on success
- Supports onError callback for custom error handling

```typescript
<AutomationWizard
  isOpen={isOpen}
  onOpenChange={setIsOpen}
  brandId={brandId}
  onSuccess={() => {
    // Refresh automations list, show toast, etc.
  }}
/>
```

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

## Performance Considerations

- **Templates Loading:** Fetched only when Step 2 is active
- **Memoization:** Step components don't re-render on wizard state changes
- **Lazy Loading:** Steps rendered on demand
- **No Validation:** Form data is locally stored, only validated on step transitions

## Future Enhancements

- [ ] CTA (Call-to-Action) selection step
- [ ] Multiple time slots per day UI improvement
- [ ] Template preview/preview carousel
- [ ] Schedule conflict detection
- [ ] A/B test automation type
- [ ] Save as draft without creating
- [ ] Template customization within wizard

## Testing

### Unit Tests

```typescript
test('Wizard validates name is required', () => {
  // Step 1 Next button should be disabled without name
});

test('Wizard requires at least one template', () => {
  // Step 2 Next button should be disabled without selection
});
```

### Integration Tests

```typescript
test('Complete wizard flow creates automation', () => {
  // Fill all steps and verify creation
});

test('Cancel button closes wizard', () => {
  // Verify modal closes
});
```

## Troubleshooting

### "Next button is disabled but I filled the form"
- Check step validation logic in `isStepValid()`
- Verify data is being saved to state

### "Templates not loading in Step 2"
- Check brand ID is passed correctly
- Verify user has templates created
- Check useTemplates hook is working

### "Wizard doesn't close after creation"
- Check network request completed successfully
- Verify `onOpenChange` is being called
- Check for errors in hook's onError callback

### "Styles not applying"
- Verify Tailwind CSS is configured
- Check for CSS conflicts
- Verify shadcn components are imported

## Dependencies

- `@radix-ui/react-dialog` - Modal component
- `@tanstack/react-query` - Data fetching
- `@/components/ui/*` - shadcn/ui components
- `@/lib/api/hooks/useAutomations` - Create automation hook
- `@/lib/api/hooks/useTemplates` - Template fetching hook
- Tailwind CSS - Styling

---

**Component Type:** Modal Form Wizard
**Last Updated:** 2026-02-02
**Status:** Production Ready
**Build Status:** ✅ Passing
