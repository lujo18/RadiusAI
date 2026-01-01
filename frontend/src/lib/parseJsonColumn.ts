import { z } from "zod";

// Background schema for styleConfig.visual.background
export const BackgroundSchema = z.object({
  type: z.string(),
  colors: z.array(z.string()),
  opacity: z.number().optional(),
});
export type Background = z.infer<typeof BackgroundSchema>;
export function parseBackground(json: unknown): Background | null {
  const result = BackgroundSchema.safeParse(json);
  return result.success ? result.data : null;
}

// Slide schema for post.content.slides
export const SlideSchema = z.object({
  slideNumber: z.number(),
  text: z.string(),
  imagePrompt: z.string().optional(),
  imageUrl: z.string().optional(),
});
export type Slide = z.infer<typeof SlideSchema>;
export function parseSlides(json: unknown): Slide[] | null {
  const result = z.array(SlideSchema).safeParse(json);
  return result.success ? result.data : null;
}

// Example: styleConfig.content
export const ContentConfigSchema = z.object({
  tone: z.string(),
  hookStyle: z.string(),
  useEmojis: z.boolean(),
  ctaTemplate: z.string(),
  forbiddenWords: z.array(z.string()),
});
export type ContentConfig = z.infer<typeof ContentConfigSchema>;
export function parseContentConfig(json: unknown): ContentConfig | null {
  const result = ContentConfigSchema.safeParse(json);
  return result.success ? result.data : null;
}

// Add more schemas as needed for other JSONB columns
