# Brand CTA API - Implementation Summary

## What Was Created

I've set up a complete CRUD API for managing Brand CTAs in your frontend, following Radius's layered architecture pattern.

### Files Created

#### 1. **Service Layer** (`lib/api/services/brandCtaService.ts`)
- Business logic and validation
- 8 methods: get, list, create, update, delete, toggle status, duplicate
- Error handling and logging
- Uses existing `brandCtasRepo` for database access

#### 2. **Surface API** (`lib/api/surface/brandCtaApi.ts`)
- Stable, UI-facing API
- Simple function names: `list`, `get`, `create`, `update`, `delete`, etc.
- Wraps service layer for clean imports
- Type-safe with database types

#### 3. **React Query Hooks** (`lib/api/hooks/useBrandCtas.ts`)
- 7 exported hooks for different operations:
  - **Queries (GET):** `useBrandCtas`, `useBrandCta`, `useAllBrandCtas`
  - **Mutations (CREATE/UPDATE/DELETE):** `useCreateBrandCta`, `useUpdateBrandCta`, `useDeleteBrandCta`, `useToggleBrandCtaStatus`, `useDuplicateBrandCta`
- Automatic cache management
- Query invalidation on mutations
- Loading and error states

### What You Can Do

**Create a CTA:**
```typescript
const { mutate } = useCreateBrandCta();
mutate({
  brandId: 'brand_123',
  payload: { label: 'Subscribe', cta_text: 'Click here' }
});
```

**Fetch CTAs:**
```typescript
const { data: ctas, isLoading } = useBrandCtas(brandId);
```

**Update a CTA:**
```typescript
const { mutate } = useUpdateBrandCta();
mutate({ ctaId: 'cta_123', updates: { label: 'New Label' } });
```

**Delete a CTA:**
```typescript
const { mutate } = useDeleteBrandCta();
mutate({ ctaId: 'cta_123', brandId: 'brand_123' });
```

**Toggle Status:**
```typescript
const { mutate } = useToggleBrandCtaStatus();
mutate({ ctaId: 'cta_123', isActive: true });
```

**Duplicate:**
```typescript
const { mutate } = useDuplicateBrandCta();
mutate({ ctaId: 'cta_123', targetBrandId: 'brand_456' });
```

## Architecture

```
UI Components
    ↓
React Query Hooks (useBrandCtas.ts)
    ↓
Surface API (brandCtaApi.ts)
    ↓
Service Layer (brandCtaService.ts)
    ↓
Repository (brandCtas.ts - existing)
    ↓
Supabase
```

## Key Features

✅ **Type-Safe** - Full TypeScript support with database types
✅ **Cached** - Automatic caching with TanStack Query (5min stale time)
✅ **Auto Invalidation** - Cache automatically updates on mutations
✅ **Error Handling** - Comprehensive error catching and logging
✅ **Composable** - Use any layer (hooks → surface API → service)
✅ **Simple API** - Consistent, predictable method names

## Usage Priority

1. **Use React Query Hooks** (Recommended) - Auto caching, loading states, error handling
2. **Use Surface API** - Direct function calls, no React dependencies
3. **Use Service Layer** - Business logic, validation

## Documentation

Full guide with examples: [BRAND_CTA_API_GUIDE.md](./BRAND_CTA_API_GUIDE.md)

## Build Status

✅ **Compiles successfully** - No TypeScript errors
✅ **All imports valid** - Proper path resolution
✅ **Ready to use** - Can start building components immediately

## Next Steps

1. Use the hooks in your CTA management page (`/brand/[brandId]/settings/ctas`)
2. Build the UI for CRUD operations
3. Add toast notifications for user feedback
4. Add form validation with Zod schemas (already available)
