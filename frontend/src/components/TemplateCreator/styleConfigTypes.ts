// All types now sourced from database.ts
import type { Tables } from '@/types/database';

export type StyleConfig = Tables<'templates'>['style_config'];
