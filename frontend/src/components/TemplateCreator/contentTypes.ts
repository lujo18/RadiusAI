// All types now sourced from database.ts
import type { Tables } from '@/types/database';

export type Template = Tables<'templates'>;
export type Profile = Tables<'profiles'>;
export type BrandSettings = Tables<'brand_settings'>;
export type PostContent = Tables<'posts'>['content'];
