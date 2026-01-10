import { z } from "zod";
import { PostContentSchema, PostSlideSchema } from "./parseJsonColumn.supabase";
import { BackgroundSchema } from "@/types/parseBackground";


// Background type and parser
export type Background = z.infer<typeof BackgroundSchema>;
export function parseBackground(json: unknown): Background | null {
  const result = BackgroundSchema.safeParse(json);
  return result.success ? result.data : null;
}

// Slide schema for post.content.slides
export type Slide = z.infer<typeof PostSlideSchema>;

export function parseSlides(json: unknown): Slide[] | null {
  const result = z.array(PostSlideSchema).safeParse(json);
  if (!result.success) {
    console.error("Failed to parse slides:", result.error);
    return null;
  }
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
