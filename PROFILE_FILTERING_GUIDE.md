# Profile Filtering System

## Overview

The dashboard now supports **URL-based profile filtering**:

- **All Profiles**: `/dashboard`, `/dashboard/templates`, etc.
- **Specific Profile**: `/dashboard/{profileId}`, `/dashboard/{profileId}/templates`, etc.

## URL Structure

```
/dashboard                    → All Profiles overview
/dashboard/{profileId}        → Profile-specific overview

/dashboard/templates          → All Profiles templates
/dashboard/{profileId}/templates → Profile templates

/dashboard/analytics          → All Profiles analytics
/dashboard/{profileId}/analytics → Profile analytics

/dashboard/generate           → All Profiles generation
/dashboard/{profileId}/generate  → Profile generation

/dashboard/calendar           → All Profiles calendar
/dashboard/{profileId}/calendar  → Profile calendar
```

## User Experience

1. **Profile Switcher** in sidebar header
   - Shows "All Profiles" or current profile name  
   - Dropdown lists all brand profiles
   - Click to switch → URL updates automatically
   - **URL changes** to reflect selection

2. **Data Filtering**
   - When URL has no profileId: Shows everything for the user
   - When URL has profileId: Filters by `profile_id`
   - Applies to: Posts, Templates, Analytics

3. **Shareable Links**
   - Copy URL to share specific profile views
   - Bookmark profile-specific pages
   - Direct navigation to filtered data

## For Developers

### Using Profile Filter in Components

```typescript
import { useProfileFilter } from '@/hooks/useProfileFilter';
import { usePosts, useTemplates, useAnalytics } from '@/lib/api/hooks';

function MyDashboardPage() {
  // Automatically reads profileId from URL params
  const { activeProfileId } = useProfileFilter();
  
  // Hooks automatically use the active profile filter
  const { data: posts } = usePosts(undefined, undefined, activeProfileId);
  const { data: templates } = useTemplates(activeProfileId);
  const { data: analytics } = useAnalytics('week', activeProfileId);
  
  return <div>...</div>;
}
```

### Profile Filter State

```typescript
// Get filter state from URL
const { activeProfileId, isAllProfiles, isProfileSpecific } = useProfileFilter();

// activeProfileId: null = "All Profiles", string = profile ID from URL
// isAllProfiles: true when URL has no profileId
// isProfileSpecific: true when URL has profileId

// Change active profile via navigation
import { useRouter } from 'next/navigation';
const router = useRouter();

router.push('/dashboard');              // Switch to All Profiles
router.push('/dashboard/profile-123');  // Switch to specific profile
router.push('/dashboard/profile-123/templates'); // Profile templates
```

### Updated Hooks

All dashboard hooks now accept optional `profileId` parameter:

```typescript
// Posts
usePosts(status?, limit?, profileId?)

// Templates  
useTemplates(profileId?)

// Analytics
useAnalytics(timeframe?, profileId?)
useVariantPerformance(profileId?)
```

## Implementation Status

### ✅ Complete

- [x] Profile store (persisted in localStorage)
- [x] Profile switcher UI in sidebar
- [x] useProfileFilter hook
- [x] Updated query hooks with profileId parameter
- [x] Updated API client functions

### ⏳ TODO: Backend Filtering

The frontend is **ready for profile filtering**, but the Supabase repository functions need updates:

#### PostRepository (backend/services/supabase/)

```python
# Add profile filtering to queries
def get_posts(user_id: str, profile_id: Optional[str] = None):
    query = supabase.from_('posts').select('*').eq('user_id', user_id)
    
    if profile_id:
        query = query.eq('profile_id', profile_id)
    
    return query.execute().data
```

#### TemplateRepository

```python
def get_templates(user_id: str, profile_id: Optional[str] = None):
    query = supabase.from_('templates').select('*').eq('user_id', user_id)
    
    if profile_id:
        query = query.eq('profile_id', profile_id)
    
    return query.execute().data
```

#### AnalyticsRepository

```python
def get_analytics(user_id: str, timeframe: str, profile_id: Optional[str] = None):
    # Join posts -> analytics, filter by profile if specified
    # ...
```

## Database Schema Requirements

Ensure these tables have `profile_id` foreign key:

- `posts` → `profiles(id)`
- `templates` → `profiles(id)`  
- `analytics` → `posts(id)` → `profiles(id)`

## Testing Profile Filtering

1. Create multiple brand profiles
2. Create templates/posts for each profile
3. Switch between "All Profiles" and specific profiles in sidebar
4. Verify:
   - "All Profiles" shows everything
   - Specific profile only shows that profile's data
   - Selection persists across page navigation

## Edge Cases

- **No profiles**: System gracefully shows "No profiles yet" in dropdown
- **Profile deleted**: Auto-switches to "All Profiles" view
- **Direct URL access**: Uses saved profile preference or defaults to "All Profiles"

