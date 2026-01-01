import { z } from "zod";

// SlideDesign background (from slide_designs)
export const SlideBackgroundSchema = z.object({
  type: z.string(),
  colors: z.array(z.string()),
  opacity: z.number().optional(),
});
export type SlideBackground = z.infer<typeof SlideBackgroundSchema>;
export function parseSlideBackground(json: unknown): SlideBackground | null {
  const result = SlideBackgroundSchema.safeParse(json);
  return result.success ? result.data : null;
}

// PostContent (from posts.content)
export const PostContentSchema = z.object({
  title: z.string(),
  caption: z.string(),
  hashtags: z.array(z.string()),
  slides: z.array(z.object({
    slideNumber: z.number(),
    text: z.string(),
    imageUrl: z.string().optional(),
    imagePrompt: z.string().optional(),
  })),
});
export type PostContent = z.infer<typeof PostContentSchema>;
export function parsePostContent(json: unknown): PostContent | null {
  const result = PostContentSchema.safeParse(json);
  return result.success ? result.data : null;
}

// Template styleConfig (from templates.style_config)
export const StyleConfigSchema = z.object({
  layout: z.object({
    slideCount: z.number(),
    aspectRatio: z.string(),
    structure: z.array(z.string()),
  }),
  visual: z.object({
    background: SlideBackgroundSchema,
    font: z.object({
      family: z.string(),
      size: z.number(),
      color: z.string(),
      effects: z.array(z.string()),
    }),
    accentColor: z.string(),
  }),
  content: z.object({
    tone: z.string(),
    hookStyle: z.string(),
    useEmojis: z.boolean(),
    ctaTemplate: z.string(),
    forbiddenWords: z.array(z.string()),
  }),
});
export type StyleConfig = z.infer<typeof StyleConfigSchema>;
export function parseStyleConfig(json: unknown): StyleConfig | null {
  const result = StyleConfigSchema.safeParse(json);
  return result.success ? result.data : null;
}

// Add more schemas for other JSONB columns as needed
