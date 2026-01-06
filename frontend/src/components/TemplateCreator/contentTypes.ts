// All types now sourced from database.ts
import type { Tables } from '@/types/database';

export type Template = Tables<'templates'>;
export type Brand = Tables<'brand'>;
export type BrandSettings = Tables<'brand_settings'>;
export type PostContent = Tables<'posts'>['content'];

// Legacy alias for backward compatibility
export type Profile = Brand;
