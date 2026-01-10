import { z } from 'zod';

// Zod schema for the background JSONB field in slide_designs
export const BackgroundSchema = z.object({
  type: z.enum(['solid', 'gradient', 'image']),
  color: z.string().nullish(),
  gradient_colors: z.array(z.string()).nullish(),
  gradient_angle: z.number().nullish(),
  image_url: z.string().nullish(),
});

export type Background = z.infer<typeof BackgroundSchema>;
