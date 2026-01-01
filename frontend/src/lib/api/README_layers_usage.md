# ViralStack Frontend Data Layer Usage Guide

## Where Does Zustand Fit?

Zustand is your global state management layer. It is used for UI state, session info, and any cross-component state that is not directly tied to your database.

---

## When to Use Zustand
- **UI state:** Modal open/close, selected IDs, active tabs, onboarding progress, etc.
- **Session state:** Current user, subscription status, feature flags.
- **Cross-component state:** Anything that needs to be shared between components but is not server data.

**Do NOT use Zustand for:**
- Fetching/mutating server data (use TanStack Query hooks for that)
- Caching Supabase/backend data

---

## How Zustand Works With Other Layers
- Use Zustand for client/UI state.
- Use TanStack Query hooks for server data (from Supabase/backend).
- Use both together: For example, fetch templates with a hook, store selectedTemplateId in Zustand.

---

## Example Usage With Zustand

```tsx
import { useTemplates } from '@/lib/api/hooks/useTemplates';
import { useDashboardStore } from '@/store/dashboardStore';

export function TemplateSelector() {
  const { data: templates } = useTemplates();
  const selectedTemplateId = useDashboardStore(state => state.selectedTemplateId);
  const setSelectedTemplateId = useDashboardStore(state => state.setSelectedTemplateId);

  return (
    <div>
      {templates?.map(t => (
        <button
          key={t.id}
          className={selectedTemplateId === t.id ? 'selected' : ''}
          onClick={() => setSelectedTemplateId(t.id)}
        >
          {t.name}
        </button>
      ))}
    </div>
  );
}
```

---

## Overview
This guide explains where and how to use each data layer in your codebase, from Supabase client to React Query hooks.

---

## 1. `lib/supabase/client.ts` & `types/database.ts`
- **Purpose:** Low-level connection and type definitions.
- **Use directly:**
  - Only in repository files (e.g., TemplateRepository) or for custom Supabase queries.
  - Not used in React components or hooks.

---

## 2. `lib/supabase/repos/`
- **Purpose:** Encapsulates all direct Supabase CRUD logic for each resource.
- **Use directly:**
  - Only in `api/client.ts` or for advanced custom logic (e.g., batch operations, admin scripts).
  - Not used in React components or hooks.

---

## 3. `api/client.ts`
- **Purpose:** Unified API for frontend, combining repository methods and backend HTTP endpoints.
- **Use directly:**
  - Only in React Query hooks (`api/hooks/`) or for custom API utilities.
  - Not used in React components.

---

## 4. `api/hooks/`
- **Purpose:** React Query hooks for data fetching and mutation.
- **Use directly:**
  - **YES:** Use these hooks in all React components/pages that need to fetch or mutate data.
  - Example: `const { data, isLoading } = useTemplates();`

---

## Best Practice: Use React Query hooks in all components
- **Why?**
  - Handles caching, loading/error states, and background refetching automatically.
  - Keeps your UI reactive and clean.
  - Centralizes all data access logic.

---

## Example Usage

```tsx
// In a React component
import { useTemplates, useCreateTemplate } from '@/lib/api/hooks/useTemplates';

export function TemplateList() {
  const { data: templates, isLoading } = useTemplates();
  const createTemplate = useCreateTemplate();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {templates?.map(t => <div key={t.id}>{t.name}</div>)}
      <button onClick={() => createTemplate.mutate({ name: 'New Template' })}>
        Add Template
      </button>
    </div>
  );
}
```

---

## Summary Table
| Layer                      | Use In Components | Use In Hooks | Use In API Client | Use In Repos |
|----------------------------|-------------------|--------------|------------------|--------------|
| supabase/client, types     | ❌                | ❌           | ❌               | ✅           |
| supabase/repos             | ❌                | ❌           | ✅               | ✅           |
| api/client                 | ❌                | ✅           | ✅               | ❌           |
| api/hooks                  | ✅                | ✅           | ❌               | ❌           |
| zustand stores             | ✅                | ✅           | ❌               | ❌           |

---

## Quick Recommendations
- **React components:** Always use React Query hooks from `api/hooks/`.
- **Never call repository or client methods directly in components.**
- **Custom logic:** If you need a new query/mutation, add it to a hook in `api/hooks/`.
- **Global UI/client state:** Use Zustand stores for anything not directly fetched from the server.

---

If you need a diagram or more examples, just ask!
