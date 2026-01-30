import { z } from 'zod';

// BrandSettings schema derived from Database types / project defaults
export const BrandSettingsSchema = z.object({
  id: z.string(),
  brand_id: z.string(),
  name: z.string().optional().default(''),
  niche: z.string().optional().default(''),
  aesthetic: z.string().optional().default(''),
  target_audience: z.string().optional().default(''),
  brand_voice: z.string().optional().default(''),
  content_pillars: z.array(z.string()).optional().default([]),
  tone_of_voice: z.string().optional().default('casual'),
  emoji_usage: z.string().optional().default('moderate'),
  forbidden_words: z.array(z.string()).optional().default([]),
  preferred_words: z.array(z.string()).optional().default([]),
  hashtag_style: z.string().optional().default('mixed'),
  hashtag_count: z.number().int().optional().default(10),
  hashtags: z.array(z.string()).nullable().optional().default([]),
  created_at: z.string().nullable().optional().default(null),
  updated_at: z.string().nullable().optional().default(null),
});

export type BrandSettings = z.infer<typeof BrandSettingsSchema>;

// Brand CTA schema
export const BrandCtaSchema = z.object({
  id: z.string(),
  brand_id: z.string(),
  label: z.string(),
  cta_text: z.string(),
  category: z.string().nullable().optional(),
  cta_type: z.string().nullable().optional(),
  cta_url: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  is_deleted: z.boolean().nullable().optional(),
  metadata: z.any().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export type BrandCta = z.infer<typeof BrandCtaSchema>;

export default {
  BrandSettingsSchema,
  BrandCtaSchema,
};
