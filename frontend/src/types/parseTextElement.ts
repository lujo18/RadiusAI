import { z } from 'zod';

// Zod schema for a single text element in a slide design
export const TextElementSchema = z.object({
  id: z.string(),
  type: z.literal('text'),
  content: z.string(),
  font_size: z.number().int().min(8).max(200),
  font_family: z.string(),
  font_style: z.enum(['normal', 'bold', 'italic']),
  color: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  align: z.enum(['left', 'center', 'right']),
  // Stroke properties
  stroke: z.string().nullish(),
  stroke_width: z.number().nullish(),
  // Shadow properties
  shadow_color: z.string().nullish(),
  shadow_blur: z.number().nullish(),
  shadow_offset_x: z.number().nullish(),
  shadow_offset_y: z.number().nullish(),
  shadow_opacity: z.number().nullish(),
  // Additional text properties
  letter_spacing: z.number().nullish(),
  line_height: z.number().nullish(),
});

// TypeScript type for a text element
export type TextElement = z.infer<typeof TextElementSchema>;

// Zod schema for an array of text elements (for use in slide_design)
export const TextElementsArraySchema = z.array(TextElementSchema);
