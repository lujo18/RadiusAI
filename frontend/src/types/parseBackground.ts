import { z } from 'zod';

// Zod schema for the background JSONB field in slide_designs
export const BackgroundSchema = z.object({
  type: z.enum(['solid', 'gradient', 'image']),
  color: z.string().optional(),
  gradient_colors: z.array(z.string()).optional(),
  gradient_angle: z.number().optional(),
  image_url: z.string().optional(),
});

export type Background = z.infer<typeof BackgroundSchema>;
