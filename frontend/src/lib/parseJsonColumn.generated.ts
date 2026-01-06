import { z } from "zod";

// BrandSettings schema (from database.ts)
export const BrandSettingsSchema = z.object({
  aesthetic: z.string(),
  brand_voice: z.string(),
  content_pillars: z.array(z.string()),
  created_at: z.string(),
  emoji_usage: z.string(),
  forbidden_words: z.array(z.string()),
  hashtag_count: z.number(),
  hashtag_style: z.string(),
  hashtags: z.array(z.string()).nullable(),
  id: z.string(),
  name: z.string(),
  niche: z.string(),
  preferred_words: z.array(z.string()),
  brand_id: z.string(),
  target_audience: z.string(),
  tone_of_voice: z.string(),
  updated_at: z.string(),
});
export type BrandSettings = z.infer<typeof BrandSettingsSchema>;
export function parseBrandSettings(json: unknown): BrandSettings | null {
  const result = BrandSettingsSchema.safeParse(json);
  return result.success ? result.data : null;
}

// ContentConfig schema (from content_rules)
export const ContentConfigSchema = z.object({
  avoid_topics: z.array(z.string()).nullable(),
  body_style: z.string(),
  created_at: z.string(),
  cta_style: z.string(),
  depth_level: z.string(),
  format: z.string(),
  hook_style: z.string(),
  id: z.string(),
  include_examples: z.boolean(),
  include_statistics: z.boolean(),
  must_include: z.array(z.string()).nullable(),
  personal_story: z.boolean(),
  perspective: z.string(),
  slide_count: z.number(),
  subtopics: z.array(z.string()).nullable(),
  template_id: z.string(),
  topic_focus: z.string(),
  updated_at: z.string(),
});
export type ContentConfig = z.infer<typeof ContentConfigSchema>;
export function parseContentConfig(json: unknown): ContentConfig | null {
  const result = ContentConfigSchema.safeParse(json);
  return result.success ? result.data : null;
}

// Add more schemas for other JSONB columns as needed
