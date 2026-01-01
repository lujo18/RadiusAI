import { z } from 'zod';

// Zod schema for the Supabase 'templates' table
export const TemplateSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  profile_id: z.string().nullable().optional(),
  name: z.string(),
  category: z.string(),
  status: z.string(),
  is_default: z.boolean(),
  favorite: z.boolean(),
  style_config: z.any(), // You can replace with a stricter schema if you have one
  tags: z.array(z.string()).nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Template = z.infer<typeof TemplateSchema>;
