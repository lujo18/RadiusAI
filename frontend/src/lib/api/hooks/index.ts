/**
 * React Query Hooks Index
 * 
 * Organized by resource type, mirroring the firebase/firestore structure.
 * Each file contains hooks for a specific resource.
 */

// Templates - Template CRUD operations
export * from './useTemplates';

// Posts - Post CRUD and content generation
export * from './usePosts';

// Profiles - Brand profile management
export * from './useProfiles';

// Analytics - Performance tracking and A/B testing
export * from './useAnalytics';

// User - User profile and account settings
export * from './useUser';

// Style Guide - AI-managed style preferences
export * from './useStyleGuide';
