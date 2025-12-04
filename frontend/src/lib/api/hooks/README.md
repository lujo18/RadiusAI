# React Query Hooks Structure

Clean, organized hooks mirroring the `firebase/firestore/` structure for easy navigation.

## 📁 File Organization

```
lib/api/hooks/
├── index.ts              # Re-exports all hooks
├── useTemplates.ts       # Template CRUD operations
├── usePosts.ts           # Post CRUD & content generation
├── useProfiles.ts        # Brand profile management
├── useAnalytics.ts       # Performance & A/B testing
├── useUser.ts            # User profile & settings
└── useStyleGuide.ts      # AI style preferences
```

## 📋 Available Hooks by Resource

### **Templates** (`useTemplates.ts`)
```tsx
import { useTemplates, useCreateTemplate } from '@/lib/api/hooks';

// Queries
useTemplates()              // Fetch all user templates
useTemplate(id)             // Fetch single template

// Mutations
useCreateTemplate()         // Create new template
useUpdateTemplate()         // Update existing template
useDeleteTemplate()         // Delete template
useSetDefaultTemplate()     // Set as default
```

### **Posts** (`usePosts.ts`)
```tsx
import { usePosts, useCreatePost } from '@/lib/api/hooks';

// Queries
usePosts(status?, limit?)   // Fetch posts (optional filters)
usePost(id)                 // Fetch single post
useScheduledPosts()         // Fetch scheduled posts

// Mutations
useCreatePost()             // Create new post
useUpdatePost()             // Update existing post
useDeletePost()             // Delete post
usePublishPost()            // Publish post
useGenerateWeek()           // AI generate week's content
```

### **Profiles** (`useProfiles.ts`)
```tsx
import { useProfiles, useCreateProfile } from '@/lib/api/hooks';

// Queries
useProfiles()               // Fetch all brand profiles

// Mutations
useCreateProfile()          // Create new profile
useUpdateBrandSettings()    // Update brand settings
useDeleteProfile()          // Delete profile
```

### **Analytics** (`useAnalytics.ts`)
```tsx
import { useAnalytics, useVariantPerformance } from '@/lib/api/hooks';

// Queries
useAnalytics(timeframe)     // Fetch analytics (day/week/month)
useVariantPerformance()     // Fetch A/B test results

// Mutations
useAnalyzeAndEvolve()       // Trigger AI analysis
```

### **User** (`useUser.ts`)
```tsx
import { useProfile, useConnectedAccounts } from '@/lib/api/hooks';

// Queries
useProfile()                // Fetch user profile
useConnectedAccounts()      // Fetch social media accounts

// Mutations
useUpdateUserProfile()      // Update user profile
```

### **Style Guide** (`useStyleGuide.ts`)
```tsx
import { useStyleGuide, useUpdateStyleGuide } from '@/lib/api/hooks';

// Queries
useStyleGuide()             // Fetch AI style guide

// Mutations
useUpdateStyleGuide()       // Update style guide
```

## ✨ Key Features

### **Automatic Cache Invalidation**
All mutations automatically invalidate relevant queries:
```tsx
const createProfile = useCreateProfile();
await createProfile.mutateAsync(data);
// ✅ useProfiles() automatically refetches
```

### **Built-in Loading States**
```tsx
const { data, isLoading, error } = useProfiles();
const mutation = useCreateProfile();
if (mutation.isPending) { /* show loading */ }
```

### **Optimistic Updates**
Queries have sensible stale times:
- Posts: 1 minute
- Templates: 2 minutes
- Analytics: 5 minutes
- User: 5 minutes
- Style Guide: 10 minutes

## 🎯 Usage Examples

### Creating a Profile
```tsx
import { useCreateProfile } from '@/lib/api/hooks';

function CreateProfileButton() {
  const createProfile = useCreateProfile();
  
  const handleCreate = async () => {
    await createProfile.mutateAsync(brandSettings);
    // List automatically updates!
  };
  
  return (
    <button onClick={handleCreate} disabled={createProfile.isPending}>
      {createProfile.isPending ? 'Creating...' : 'Create Profile'}
    </button>
  );
}
```

### Fetching Templates
```tsx
import { useTemplates } from '@/lib/api/hooks';

function TemplatesList() {
  const { data: templates, isLoading, error } = useTemplates();
  
  if (isLoading) return <Loading />;
  if (error) return <Error />;
  
  return templates.map(template => <TemplateCard {...template} />);
}
```

## 🔄 Migration from Old Structure

**Before** (monolithic `hooks.ts`):
```tsx
import { useTemplates, useCreatePost } from '@/lib/api/hooks';
```

**After** (organized by resource):
```tsx
// Still works! Everything is re-exported from index
import { useTemplates, useCreatePost } from '@/lib/api/hooks';

// Or import from specific file for clarity
import { useTemplates } from '@/lib/api/hooks/useTemplates';
```

All existing imports still work - no breaking changes!
