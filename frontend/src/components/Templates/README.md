# Template View Switcher Components

## Overview

These components provide a view-switching system for displaying templates in either **Card View** (grid layout) or **Table View** (structured table).

## Components

### 1. `TemplateViewSwitcher`
**Path:** `src/components/Templates/TemplateViewSwitcher.tsx`

The main container component that manages view switching between card and table views.

#### Props
```typescript
interface TemplateViewSwitcherProps {
  templates: Template[] | undefined;      // Array of template data
  isLoading: boolean;                     // Loading state
  brandId: string;                        // Brand ID for navigation
  onDelete: (templateId: string) => void; // Delete handler
  onCreateClick: () => void;              // Create button handler
}
```

#### Features
- Toggle buttons to switch between Card and Table views
- Card view displays templates in a 3-column grid
- Responsive design with loading skeletons
- Empty state handling with call-to-action
- Integrated edit and delete actions

#### Usage
```tsx
import TemplateViewSwitcher from '@/components/Templates/TemplateViewSwitcher';

<TemplateViewSwitcher
  templates={templates}
  isLoading={isLoading}
  brandId={brandId}
  onDelete={handleDelete}
  onCreateClick={handleCreate}
/>
```

### 2. `TemplateTableView`
**Path:** `src/components/Templates/TemplateTableView.tsx`

Displays templates in a structured table format using shadcn's table component.

#### Props
```typescript
interface TemplateTableViewProps {
  templates: Template[] | undefined;
  isLoading: boolean;
  brandId: string;
  onDelete: (templateId: string) => void;
}
```

#### Columns
- **Name** - Template name with default badge
- **Category** - Template category badge
- **Status** - Template status (active/testing)
- **Total Posts** - Number of posts generated
- **Avg Engagement** - Average engagement rate percentage
- **Avg Saves** - Average saves metric
- **Actions** - Edit and delete buttons

#### Features
- Automatic row highlighting for default templates
- Responsive table with proper column sizing
- Edit and delete action buttons
- Loading skeleton for smooth loading experience

#### Usage
```tsx
import TemplateTableView from '@/components/Templates/TemplateTableView';

<TemplateTableView
  templates={templates}
  isLoading={isLoading}
  brandId={brandId}
  onDelete={handleDelete}
/>
```

## Integration

Both components are integrated into `TemplatesTab.tsx` and work together to provide a seamless user experience.

### Updated TemplatesTab
The `TemplatesTab` component now:
1. Displays the new `TemplateViewSwitcher` instead of hardcoded card grid
2. Maintains all original functionality (create, delete, edit)
3. Keeps the statistics cards at the bottom
4. Manages template data fetching and mutations

## Data Structure

Both components expect templates to follow the `Template` type from `src/types/template.ts`:

```typescript
export type Template = {
  id: string;
  user_id: string;
  brand_id?: string;
  name: string;
  category: string;
  status: string;
  is_default: boolean;
  favorite: boolean;
  style_config?: any;
  tags?: string[];
  created_at: string;
  updated_at: string;
  parent_id?: string;
  content_rules?: any;
  performance?: {
    total_posts: number;
    avg_engagement_rate: number;
    avg_saves: number;
  };
}
```

## Styling

Both components follow the project's design system:
- Use `bg-card/50 backdrop-blur-md` for glassmorphism
- Use `border-border` for consistent borders
- Use `text-chart-4` for engagement metrics (green)
- Responsive with `md:` and `lg:` breakpoints
- Smooth transitions on hover

## Notes

- The components automatically handle loading states with skeletons
- Empty states are handled with helpful messaging
- All data mutations (delete) are passed up via callbacks
- Navigation (edit) uses Next.js router for client-side navigation
- Table view maintains proper column sizing for readability
