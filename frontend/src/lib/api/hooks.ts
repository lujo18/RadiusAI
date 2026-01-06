/**
 * React Query Hooks - Central Export
 * 
 * All hooks are organized by resource type in separate files.
 * Import from this file for convenience:
 * 
 * import { useTemplates, useCreateTemplate } from '@/lib/api/hooks';
 */

// Templates
export * from './hooks/useTemplates';

// Posts
export * from './hooks/usePosts';

// Brands (formerly Profiles)
export * from './hooks/useBrands';

// Analytics
export * from './hooks/useAnalytics';

// User Profile - renamed to avoid conflict with useProfile from useProfiles
export { useUser } from './hooks/useUser';
