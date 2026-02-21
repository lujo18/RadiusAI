# Team Refactor - Frontend Implementation Guide

## Overview
This guide explains how to migrate the frontend from user-based routing to team-based routing with the structure `[teamId]/(routes)`.

## Current Structure
```
src/app/(app)/
├── layout.tsx
├── overview/
├── brand/
├── connect-social/
└── settings/
```

## Target Structure
```
src/app/(app)/
├── page.tsx                 # Redirect to default team (/[teamId]/overview)
└── [teamId]/
    ├── layout.tsx           # Team context provider
    ├── page.tsx             # Redirect to overview
    ├── overview/
    ├── brand/
    ├── templates/           # NEW
    ├── posts/               # NEW
    ├── automations/         # NEW (if applicable)
    ├── settings/            # Team settings (members, team info)
    └── members/             # Team member management
```

## Migration Steps

### Step 1: Create Team Context Layout
**File**: `src/app/(app)/[teamId]/layout.tsx`
- Extract `teamId` from route params
- Validate user can access team via `useTeam(teamId)` hook
- Set Zustand `teamStore.setCurrentTeam(team)`
- Wrap children in layout

### Step 2: Create Root Redirect
**File**: `src/app/(app)/page.tsx`
- Use `useAuth()` hook to get current user
- Use `useUserTeams()` hook to get teams
- Redirect to `/[defaultTeamId]/overview`
- Show loading state while fetching

### Step 3: Update All Pages to Accept TeamId
Move these pages under `[teamId]/`:
- `overview/` → `[teamId]/overview/`
- `brand/` → `[teamId]/brand/`
- `settings/` → `[teamId]/settings/` (update to team settings)

Update each page to:
```typescript
export default function Page({ params }: { params: { teamId: string } }) {
  const { data: teams } = useTeams(params.teamId)  // Now uses teamId from URL
}
```

### Step 4: Create New Team Routes
- `[teamId]/members/` - Member management page
- `[teamId]/templates/` - Template management (if separate from brand)
- `[teamId]/posts/` - Post management (if separate page needed)

### Step 5: Update Repositories
All repositories in `frontend/src/lib/supabase/repos/` need updating:

```typescript
// BEFORE
async getTemplates(userId: string) {
  return this.client
    .from('templates')
    .select()
    .eq('user_id', userId)
}

// AFTER
async getTemplates(teamId: string) {
  return this.client
    .from('templates')
    .select()
    .eq('team_id', teamId)
}
```

Files to update:
- `TemplateRepository.ts`
- `PostRepository.ts`
- `BrandRepository.ts`
- `VariantRepository.ts`
- `IntegrationRepository.ts`

### Step 6: Update Hooks
Update TanStack Query hooks to extract `teamId` from URL params:

```typescript
// BEFORE
export function useTemplates(userId: string) {
  return useQuery({
    queryKey: ['templates', userId],
    queryFn: () => surfaceAPI.templates.getByUser(userId)
  })
}

// AFTER
export function useTemplates() {
  const params = useParams()
  const teamId = params.teamId as string
  
  return useQuery({
    queryKey: ['templates', teamId],
    queryFn: () => surfaceAPI.templates.getByTeam(teamId),
    enabled: !!teamId
  })
}
```

### Step 7: Update Zustand Stores
Update `teamStore`:
```typescript
interface TeamStore {
  currentTeam: Team | null
  setCurrentTeam: (team: Team) => void
}

// Usage in components:
const team = teamStore.currentTeam  // Set by [teamId]/layout.tsx
```

Update `authStore`:
```typescript
interface AuthStore {
  // ... existing fields
  userTeams: Team[]
  loadUserTeams: () => Promise<void>  // Called on login
}
```

### Step 8: Update Navigation & Components
- **Sidebar**: Show current team name (from URL context)
- **Team Switcher**: 
  ```typescript
  router.push(`/[${newTeamId}]/overview`)  // Navigate to new team
  ```
- **Create Buttons**: Ensure they pass `teamId` to create requests
- **Links**: Update `/brand/...` → `/[teamId]/brand/...`

## Safe Migration Approach

### Phase A: Parallel Running (Days 1-3)
1. Both old routes (`/overview`, `/brand`, etc.) and new routes (`/[teamId]/overview`, etc.) work
2. New routes use team-based queries
3. Old routes still use user-based queries (if needed)
4. Frontend build continues to work

### Phase B: Cutover (Day 4)
1. Redirect old routes to new routes
2. Remove old route files
3. Update all internal links to use new [teamId] structure
4. Test thoroughly

### Phase C: Cleanup (Day 5+)
1. Remove old route files completely
2. Remove fallback logic from repositories
3. Update all components to remove userId references

## Testing Checklist

- [ ] Can access `/[teamId]/overview` with valid team
- [ ] Cannot access `/[teamId]/overview` with invalid team (403)
- [ ] Team switcher navigation works (`/[teamId1]/overview` → `/[teamId2]/overview`)
- [ ] All data queries filter by `team_id` (verify in network inspector)
- [ ] Create template requires `team_id` parameter
- [ ] Create post requires `team_id` parameter
- [ ] Browser back/forward maintains team context
- [ ] Deep links work: `/[teamId]/brand/123` loads correct brand in correct team
- [ ] RLS policies block cross-team access (test with direct API calls if possible)

## API Call Updates

### Create Template
```typescript
// BEFORE
POST /api/templates
{
  "name": "My Template",
  "category": "Social"
}

// AFTER
POST /api/templates
{
  "teamId": "team-123",  // NEW - REQUIRED
  "name": "My Template",
  "category": "Social"
}
```

### Create Post
```typescript
// BEFORE
POST /api/posts
{
  "templateId": "tmpl-123",
  "content": {...}
}

// AFTER
POST /api/posts
{
  "teamId": "team-123",  // NEW - REQUIRED
  "templateId": "tmpl-123",
  "content": {...}
}
```

## Key Files to Update (in order of priority)

1. **Routing**:
   - `src/app/(app)/page.tsx` (CREATE - redirect)
   - `src/app/(app)/[teamId]/layout.tsx` (CREATE - team context)
   - `src/app/(app)/[teamId]/overview/page.tsx` (MOVE)
   - `src/app/(app)/[teamId]/brand/page.tsx` (MOVE)
   - `src/app/(app)/[teamId]/settings/page.tsx` (UPDATE - team settings)

2. **Repositories**:
   - `src/lib/supabase/repos/TemplateRepository.ts` (MODIFY all methods)
   - `src/lib/supabase/repos/PostRepository.ts` (MODIFY all methods)
   - `src/lib/supabase/repos/BrandRepository.ts` (MODIFY all methods)
   - `src/lib/supabase/repos/teams.ts` (UPDATE `getUserTeams`)

3. **Hooks**:
   - `src/lib/api/hooks/useTemplates.ts` (MODIFY)
   - `src/lib/api/hooks/usePosts.ts` (MODIFY)
   - `src/lib/api/hooks/useBrands.ts` (MODIFY)
   - `src/lib/api/hooks/useTeams.ts` (CREATE/ENHANCE - get user teams)

4. **Components**:
   - `src/components/Dashboard/Sidebar.tsx` (MODIFY - team context)
   - `src/components/Dashboard/TeamSwitcher.tsx` (CREATE/UPDATE)
   - `src/components/Dashboard/Header.tsx` (MODIFY - show team name)
   - All form components that create data (add teamId to requests)

5. **Stores**:
   - `src/lib/zustand/stores/teamStore.ts` (UPDATE/CREATE)
   - `src/lib/zustand/stores/authStore.ts` (UPDATE - add user teams)

## Backward Compatibility Notes

**During Migration**: The backend RLS policies are designed to allow both `team_id` and `user_id` filtering for backward compatibility:
```sql
CREATE POLICY templates_select ON templates FOR SELECT
USING (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() ...)
  OR user_id = auth.uid()  -- Fallback compatibility
);
```

This means:
- Old queries using `user_id` will still work (fallback)
- New queries using `team_id` will be preferred
- You can migrate incrementally without breaking old code

## Environment Considerations

- **Development**: Test with multiple teams to ensure RLS works correctly
- **Staging**: Run full smoke test suite with team-based routing
- **Production**: Keep old routes active for 1-2 releases as fallback before full cutover

## Rollback Plan

If issues arise:
1. Revert the routing structure change
2. Keep backend models with team_id fields (no harm)
3. Frontend falls back to accessing old routes
4. Update routing gradually in next iteration

---

**Estimated Time**: 1-2 days for experienced developer, depends on codebase familiarity
