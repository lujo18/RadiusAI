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

// Profiles
export * from './hooks/useProfiles';

// Analytics
export * from './hooks/useAnalytics';

// User Profile
export * from './hooks/useUser';

// Style Guide
export * from './hooks/useStyleGuide';
