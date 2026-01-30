// All types now sourced from database.ts
import type { Tables } from '@/types/database';

export type Template = Tables<'templates'>;
export type Brand = Tables<'brand'>;
export type BrandSettings = "";
export type CtaSettings = Tables<'brand_ctas'>;
export type PostContent = Tables<'posts'>['content'];

// Legacy alias for backward compatibility
export type Profile = Brand;
