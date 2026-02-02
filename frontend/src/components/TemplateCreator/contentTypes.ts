// All types now sourced from database.ts
import type { Database } from '@/types/database';
import type { BrandSettings as BrandSettingsSchemaType } from '@/lib/validation/brandSchemas';

export type Template = Database['public']['Tables']['templates']['Row'];
export type Brand = Database['public']['Tables']['brand']['Row'];
export type BrandSettings = BrandSettingsSchemaType;
export type CtaSettings = Database['public']['Tables']['brand_ctas']['Row'];
export type PostContent = Database['public']['Tables']['posts']['Row']['content'];

// Legacy alias for backward compatibility
export type Profile = Brand;
