// Compatibility barrel: re-export commonly used legacy hook APIs
export * from '@/features/posts/hooks';
export * from '@/features/brand/hooks';
export * from '@/features/templates/hooks';
export * from '@/features/user/hooks';
export * from '@/features/brand_ctas/hooks';
export * from '@/features/presetPacks/hooks';
export * from '@/features/automation/hooks';

// Keep legacy surface-specific hooks where present in lib/api/hooks (these files may still exist)
export * from './usePlans';export * from './useBrands';
export * from './usePosts';
export * from './usePresetPacks';
export * from './useSubscription';
export * from './useUser';
export * from './useUsage';
export * from './useSystemTemplates';
export * from './useTemplates';
export * from './useTestimonials';
export * from './useStripeProducts';
export * from './useBrandCtas';
export * from './useAutomations';
export * from './usePlans';
export * from './useAnalytics';
