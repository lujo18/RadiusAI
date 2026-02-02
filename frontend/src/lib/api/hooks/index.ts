/**
 * React Query Hooks Index
 * 
 * Organized by resource type, mirroring the database structure.
 * Each file contains hooks for a specific resource.
 */

// Templates - Template CRUD operations
export * from './useTemplates';

// Posts - Post CRUD and publishing
export * from './usePosts';

// Brands - Brand profile management
export * from './useBrands';

// Analytics - Performance tracking and A/B testing
export * from './useAnalytics';

// User - User profile and account settings
export * from './useUser';

// Generation hooks (AI content generation)
export { useGeneratePost, useGeneratePostFromPrompt } from '@/lib/api/generation/hooks/useGeneratePost';
export { useGenerateBrand } from '@/lib/api/generation/hooks/useGenerateBrand';
export { useGenerateVariants } from '@/lib/api/generation/hooks/useGenerateVariants';
