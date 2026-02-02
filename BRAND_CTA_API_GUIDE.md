# Brand CTA API - Frontend CRUD Guide

## Overview

Complete CRUD operations for managing Brand CTAs (Call-to-Actions) in your frontend. Uses the layered architecture: Repository → Service → Surface API → React Query Hooks.

## Architecture Layers

```
UI Component
    ↓
React Query Hooks (useBrandCtas.ts)
    ↓
Surface API (brandCtaApi.ts)
    ↓
Service Layer (brandCtaService.ts)
    ↓
Repository (brandCtas.ts - existing)
    ↓
Supabase Database
```

---

## Quick Start

### Using React Query Hooks (Recommended)

```typescript
'use client';

import { useBrandCtas, useCreateBrandCta, useUpdateBrandCta } from '@/lib/api/hooks/useBrandCtas';

export function BrandCtaManager({ brandId }: { brandId: string }) {
  // Fetch CTAs
  const { data: ctas, isLoading, error } = useBrandCtas(brandId);
  
  // Create CTA
  const { mutate: createCta, isPending: isCreating } = useCreateBrandCta();
  
  // Update CTA
  const { mutate: updateCta, isPending: isUpdating } = useUpdateBrandCta();

  const handleCreate = () => {
    createCta({
      brandId,
      payload: {
        label: 'Subscribe',
        cta_text: 'Subscribe to our newsletter',
        cta_url: 'https://example.com/subscribe',
      },
    });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={handleCreate} disabled={isCreating}>
        {isCreating ? 'Creating...' : 'Create CTA'}
      </button>
      
      <ul>
        {ctas?.map(cta => (
          <li key={cta.id}>
            <h3>{cta.label}</h3>
            <p>{cta.cta_text}</p>
            <button onClick={() => updateCta({ 
              ctaId: cta.id, 
              updates: { label: 'Updated' } 
            })}>
              Update
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## API Reference

### Query Hooks (Data Fetching)

#### `useBrandCtas(brandId)`
Fetch all CTAs for a specific brand.

```typescript
const { data, isLoading, error, refetch } = useBrandCtas(brandId);
// data: BrandCtaRow[] or undefined
```

**Props:**
- `brandId: string` - Brand ID to fetch CTAs for

**Returns:**
- `data`: Array of CTAs
- `isLoading`: Loading state
- `error`: Any errors
- `refetch`: Manual refetch function

---

#### `useBrandCta(ctaId)`
Fetch a single CTA by ID.

```typescript
const { data, isLoading, error } = useBrandCta(ctaId);
// data: BrandCtaRow | undefined
```

**Props:**
- `ctaId: string | null` - CTA ID (can be null to disable query)

---

#### `useAllBrandCtas()`
Fetch all CTAs across all brands.

```typescript
const { data, isLoading, error } = useAllBrandCtas();
// data: BrandCtaRow[] or undefined
```

---

### Mutation Hooks (Write Operations)

#### `useCreateBrandCta()`
Create a new CTA.

```typescript
const { mutate, isPending, error } = useCreateBrandCta();

mutate({
  brandId: 'brand_123',
  payload: {
    label: 'Subscribe',
    cta_text: 'Subscribe now',
    cta_url: 'https://example.com/subscribe',
    category: 'email',
    cta_type: 'subscription',
    is_active: true,
  },
});
```

**Payload Fields:**
- `label` (required): Display name
- `cta_text` (required): CTA button text
- `cta_url` (optional): Link URL
- `category` (optional): CTA category
- `cta_type` (optional): Type of CTA
- `is_active` (optional): Active status (default: true)
- `metadata` (optional): Additional data

---

#### `useUpdateBrandCta()`
Update an existing CTA.

```typescript
const { mutate, isPending, error } = useUpdateBrandCta();

mutate({
  ctaId: 'cta_123',
  updates: {
    label: 'Updated Label',
    cta_text: 'Updated text',
    is_active: false,
  },
});
```

**Updates:** Any combination of fields (all optional)

---

#### `useDeleteBrandCta()`
Delete a CTA.

```typescript
const { mutate, isPending, error } = useDeleteBrandCta();

mutate({
  ctaId: 'cta_123',
  brandId: 'brand_123', // for cache invalidation
});
```

---

#### `useToggleBrandCtaStatus()`
Activate or deactivate a CTA.

```typescript
const { mutate, isPending, error } = useToggleBrandCtaStatus();

mutate({
  ctaId: 'cta_123',
  isActive: true,
});
```

---

#### `useDuplicateBrandCta()`
Duplicate a CTA to another brand.

```typescript
const { mutate, isPending, error } = useDuplicateBrandCta();

mutate({
  ctaId: 'cta_123',
  targetBrandId: 'brand_456',
});
```

---

## Direct Surface API Usage

If you need to use the API directly without React Query:

```typescript
import { brandCtaApi } from '@/lib/api/surface/brandCtaApi';

// Get operations
const ctas = await brandCtaApi.list(brandId);
const cta = await brandCtaApi.get(ctaId);
const allCtas = await brandCtaApi.listAll();

// Create
const newCta = await brandCtaApi.create(brandId, {
  label: 'Subscribe',
  cta_text: 'Subscribe now',
});

// Update
const updated = await brandCtaApi.update(ctaId, {
  label: 'New Label',
});

// Delete
await brandCtaApi.delete(ctaId);

// Additional operations
const toggled = await brandCtaApi.toggleStatus(ctaId, true);
const duplicate = await brandCtaApi.duplicate(ctaId, targetBrandId);
```

---

## Service Layer Usage

Access business logic directly:

```typescript
import { brandCtaService } from '@/lib/api/services/brandCtaService';

const ctas = await brandCtaService.getBrandCtas(brandId);
const cta = await brandCtaService.getBrandCta(ctaId);
await brandCtaService.createBrandCta(brandId, payload);
await brandCtaService.updateBrandCta(ctaId, updates);
await brandCtaService.deleteBrandCta(ctaId);
```

---

## Data Types

### BrandCtaRow (Response)
```typescript
{
  id: string;
  brand_id: string;
  label: string;
  cta_text: string;
  category?: string | null;
  cta_type?: string | null;
  cta_url?: string | null;
  is_active?: boolean | null;
  is_deleted?: boolean | null;
  metadata?: any | null;
  created_at?: string | null;
  updated_at?: string | null;
}
```

### BrandCtaInsert (Create Payload)
```typescript
{
  brand_id: string;
  label: string;
  cta_text: string;
  category?: string | null;
  cta_type?: string | null;
  cta_url?: string | null;
  is_active?: boolean;
  metadata?: any;
}
```

### BrandCtaUpdate (Update Payload)
All fields optional - only include fields to update.

---

## Example: Complete CTA Manager Component

```typescript
'use client';

import { useState } from 'react';
import {
  useBrandCtas,
  useCreateBrandCta,
  useUpdateBrandCta,
  useDeleteBrandCta,
  useToggleBrandCtaStatus,
} from '@/lib/api/hooks/useBrandCtas';

export function BrandCtaManager({ brandId }: { brandId: string }) {
  const [formData, setFormData] = useState({
    label: '',
    cta_text: '',
    cta_url: '',
    category: '',
  });

  // Queries & Mutations
  const { data: ctas, isLoading, error } = useBrandCtas(brandId);
  const { mutate: createCta, isPending: isCreating } = useCreateBrandCta();
  const { mutate: updateCta } = useUpdateBrandCta();
  const { mutate: deleteCta } = useDeleteBrandCta();
  const { mutate: toggleStatus } = useToggleBrandCtaStatus();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createCta({
      brandId,
      payload: formData,
    });
    setFormData({ label: '', cta_text: '', cta_url: '', category: '' });
  };

  if (isLoading) return <div>Loading CTAs...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="space-y-6">
      {/* Create Form */}
      <form onSubmit={handleCreate} className="space-y-4">
        <h2 className="text-xl font-bold">Create New CTA</h2>
        
        <input
          type="text"
          placeholder="Label"
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          required
        />
        
        <input
          type="text"
          placeholder="CTA Text"
          value={formData.cta_text}
          onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
          required
        />
        
        <input
          type="url"
          placeholder="URL (optional)"
          value={formData.cta_url}
          onChange={(e) => setFormData({ ...formData, cta_url: e.target.value })}
        />
        
        <input
          type="text"
          placeholder="Category (optional)"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        />
        
        <button type="submit" disabled={isCreating}>
          {isCreating ? 'Creating...' : 'Create CTA'}
        </button>
      </form>

      {/* CTA List */}
      <div>
        <h2 className="text-xl font-bold mb-4">Your CTAs</h2>
        
        {ctas && ctas.length === 0 && <p>No CTAs yet. Create one above!</p>}
        
        <div className="space-y-4">
          {ctas?.map((cta) => (
            <div key={cta.id} className="border p-4 rounded">
              <h3 className="font-bold">{cta.label}</h3>
              <p className="text-gray-600">{cta.cta_text}</p>
              {cta.cta_url && <a href={cta.cta_url}>{cta.cta_url}</a>}
              
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => toggleStatus({ ctaId: cta.id, isActive: !cta.is_active })}
                  className={cta.is_active ? 'bg-green-500' : 'bg-gray-500'}
                >
                  {cta.is_active ? 'Active' : 'Inactive'}
                </button>
                
                <button
                  onClick={() => updateCta({
                    ctaId: cta.id,
                    updates: { label: prompt('New label?') || cta.label },
                  })}
                >
                  Edit
                </button>
                
                <button
                  onClick={() => deleteCta({ ctaId: cta.id, brandId })}
                  className="bg-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## Error Handling

All hooks include error handling. Access errors like this:

```typescript
const { mutate, error, isPending } = useCreateBrandCta();

mutate(payload, {
  onError: (error) => {
    // Handle error
    console.error('Failed:', error.message);
    // Show toast notification, etc
  },
  onSuccess: (data) => {
    // Show success message
  },
});
```

---

## Cache Management

Query keys are automatically managed for cache invalidation:

```typescript
export const brandCtaKeys = {
  all: ['brand-ctas'],
  lists: () => [...],
  list: (brandId: string) => [...],
  details: () => [...],
  detail: (ctaId: string) => [...],
};
```

Manual invalidation if needed:

```typescript
const queryClient = useQueryClient();

// Invalidate all CTA queries
queryClient.invalidateQueries({ queryKey: brandCtaKeys.all });

// Invalidate specific brand's CTAs
queryClient.invalidateQueries({ queryKey: brandCtaKeys.list(brandId) });
```

---

## Files Structure

```
frontend/src/lib/api/
├── hooks/
│   └── useBrandCtas.ts          ← React Query hooks
├── services/
│   └── brandCtaService.ts       ← Business logic
└── surface/
    └── brandCtaApi.ts           ← Stable UI API

frontend/src/lib/supabase/
└── repos/
    └── brandCtas.ts             ← Database access (existing)
```

---

## Best Practices

1. **Always use hooks in components** - Use React Query hooks for automatic caching and state management
2. **Disable queries conditionally** - Pass `enabled: !!brandId` to avoid unnecessary requests
3. **Handle loading states** - Show spinners while data is loading
4. **Handle errors gracefully** - Show user-friendly error messages
5. **Invalidate cache properly** - The hooks handle this automatically on mutations
6. **Use TypeScript** - All operations are fully type-safe

---

## Testing

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBrandCtas, useCreateBrandCta } from '@/lib/api/hooks/useBrandCtas';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createWrapper = () => {
  const queryClient = new QueryClient();
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

test('fetch brand CTAs', async () => {
  const { result } = renderHook(() => useBrandCtas('brand_123'), {
    wrapper: createWrapper(),
  });

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });

  expect(result.current.data).toBeDefined();
});
```

---

## Support

For questions or issues:
- Check existing implementations in `lib/api/hooks/`
- Review [TanStack Query documentation](https://tanstack.com/query/latest)
- Review [Supabase JavaScript client docs](https://supabase.com/docs/reference/javascript)
