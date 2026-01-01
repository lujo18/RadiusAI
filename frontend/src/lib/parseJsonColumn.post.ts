import { z } from "zod";

// PostMetadata (from posts.metadata and post_metadata.generation_params)
export const GenerationParamsSchema = z.object({
  // Add fields as needed based on your local type definition
  // Example fields:
  model: z.string().optional(),
  temperature: z.number().optional(),
  maxTokens: z.number().optional(),
  // ...add more fields as needed
});
export type GenerationParams = z.infer<typeof GenerationParamsSchema>;
export function parseGenerationParams(json: unknown): GenerationParams | null {
  const result = GenerationParamsSchema.safeParse(json);
  return result.success ? result.data : null;
}

export const PostMetadataSchema = z.object({
  created_at: z.string(),
  generation_params: GenerationParamsSchema.optional(),
  id: z.string(),
  post_id: z.string(),
  variant_label: z.string().nullable(),
});
export type PostMetadata = z.infer<typeof PostMetadataSchema>;
export function parsePostMetadata(json: unknown): PostMetadata | null {
  const result = PostMetadataSchema.safeParse(json);
  return result.success ? result.data : null;
}

// StorageUrls (from posts.storage_urls and storage_urls.slide_urls)
export const StorageUrlsSchema = z.object({
  slide_urls: z.array(z.string()),
  thumbnail: z.string().nullable(),
});
export type StorageUrls = z.infer<typeof StorageUrlsSchema>;
export function parseStorageUrls(json: unknown): StorageUrls | null {
  const result = StorageUrlsSchema.safeParse(json);
  return result.success ? result.data : null;
}

// Add more schemas for other JSONB columns as needed
