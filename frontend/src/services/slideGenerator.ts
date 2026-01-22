/**
 * Slide Generation Service
 *
 * High-level API for generating slide images from PostContent.
 * Abstracts worker communication and provides Promise-based interface.
 *
 * Usage:
 * ```ts
 * const blobs = await generateSlideImages(postContent);
 * // Upload blobs to Supabase Storage
 * ```
 */

import type { Tables } from "@/types/database";
import { parseSlides, parseContentConfig } from "@/lib/parseJsonColumn";
import { Background, BackgroundSchema } from "@/types/parseBackground";
import { TextElement, TextElementsArraySchema } from "@/types/parseTextElement";
import { z } from "zod";
import { contentApi } from "@/lib/api/client";
import { buildStageForExport, stageToBlob } from "@/lib/konva/stageBuilder";
import { StorageRepository } from "@/lib/supabase/repos/StorageRepository";
import { PostRepository } from "@/lib/supabase/repos/PostRepository";

// Type alias for backward compatibility
type LayoutConfig = {
  aspect_ratio: AspectRatio;
  [key: string]: any;
};

interface GenerationProgress {
  slideIndex: number;
  progress: number;
  total: number;
}

interface GenerationResult {
  slideIndex: number;
  blob: Blob;
}

interface GenerationError {
  slideIndex: number;
  error: string;
}

type AspectRatio = "4:5" | "1:1" | "9:16";
type Template = Tables<"templates">;
type Brand = Tables<"brand">;
type BrandSettings = Tables<"brand_settings">;
type PostContent = Tables<"posts">["content"];
type PostSlide = {
  background: Background;
  elements: TextElement[];
  [key: string]: any;
};

export async function createPostsFromTemplate(
  template: Template,
  brand: Brand,
  count: number = 1
): Promise<Blob[]> {
  // Extract brand settings from brand (stored as Json)
  // Parse brandSettings JSONB if you have a Zod schema (add to parseJsonColumn.ts if needed)
  // const brandSettings = parseBrandSettings(brand.brand_settings);
  // For now, fallback to direct cast

  const brandSettings = brand.brand_settings as unknown as BrandSettings;

  const response = await contentApi.generatePosts(
    template,
    brandSettings,
    count
  );

  const posts = response.postContent as PostContent[];

  console.log("Posts generated", posts);
  const allBlobs: Blob[] = [];

  for (const postContent of posts) {
    const postBlobs = await generateSlidesInWorker(postContent);
    allBlobs.push(...postBlobs);
  }

  return allBlobs;
}

export async function createPostsFromPrompt(
  prompt: string,
  brand: Brand,
  count: number = 1
): Promise<Blob[]> {
  // Extract brand settings from brand (stored as Json)
  // Parse brandSettings JSONB if you have a Zod schema (add to parseJsonColumn.ts if needed)
  // const brandSettings = parseBrandSettings(brand.brand_settings);
  // For now, fallback to direct cast

  const brandSettings = brand.brand_settings as unknown as BrandSettings;

  const response = await contentApi.generatePostsFromPrompt(
    prompt,
    brandSettings,
    brand.id, // brandId
    count
  );

  const posts = response as PostContent[];

  console.log("Posts generated", posts);
  const allBlobs: Blob[] = [];

  for (const postContent of posts) {
    const postBlobs = await generateSlidesInWorker(postContent);
    allBlobs.push(...postBlobs);
  }

  return allBlobs;
}

/**
 * Generates slide images from PostContent on the main thread using Konva
 *
 * This approach guarantees pixel-perfect rendering that matches the template editor.
 * Uses batching and async/await to keep UI responsive during generation.
 *
 * @param postContent - The post content with slides and layout
 * @param onProgress - Optional callback for progress updates
 * @returns Promise resolving to array of Blobs in slide order
 */
export async function generateSlidesInWorker(
  // Example usage for styleConfig.content
  // If you have template available, parse contentConfig
  // const contentConfig = parseContentConfig(template?.styleConfig?.content);
  // if (!contentConfig) return null; // handle error
  postContent: PostContent,
  onProgress?: (progress: GenerationProgress) => void
): Promise<Blob[]> {
  try {

    console.log("First line slides", (postContent as any)?.slides)
    // Parse JSONB column for slides using Zod
    const slidesRaw = parseSlides((postContent as any)?.slides) ?? [];

    console.log("Raw slides", slidesRaw)

    // Parse/validate background and elements for each slide
    const slides: PostSlide[] = slidesRaw.map((slide: any) => {
      let parsedBackground: Background = { type: "solid", color: "#000" };
      let parsedElements: TextElement[] = [];
      try {
        parsedBackground = BackgroundSchema.parse(
          typeof slide.background === "string"
            ? JSON.parse(slide.background)
            : slide.background
        );
      } catch {}
      try {
        parsedElements = TextElementsArraySchema.parse(
          typeof slide.elements === "string"
            ? JSON.parse(slide.elements)
            : slide.elements
        );
      } catch {}
      return {
        ...slide,
        background: parsedBackground,
        elements: parsedElements,
      };
    });
    const layout = (postContent as any)?.layout ?? {};
    const totalSlides = slides.length;
    const blobs: Blob[] = [];

    console.log(`Starting generation of ${totalSlides} slides on main thread`);

    // Process slides in small batches to keep UI responsive
    const BATCH_SIZE = 3;

    for (let i = 0; i < slides.length; i += BATCH_SIZE) {
      const batch = slides.slice(i, Math.min(i + BATCH_SIZE, slides.length));

      // Generate batch in parallel
      const batchBlobs = await Promise.all(
        batch.map(async (slide: PostSlide) => {
          try {
            // slide.background and slide.elements are now parsed/validated
            console.log("Slide", slide);
            console.log("Layout", layout);
            const blob = await generateSlideImage(slide, layout);

            // Notify progress
            if (onProgress) {
              onProgress({
                slideIndex: slide.slideNumber,
                progress: ((blobs.length + 1) / totalSlides) * 100,
                total: totalSlides,
              });
            }

            return blob;
          } catch (error: any) {
            console.error(
              `Failed to generate slide ${slide.slideNumber}:`,
              error
            );
            throw error;
          }
        })
      );

      blobs.push(...batchBlobs);

      // Yield to UI thread between batches
      if (i + BATCH_SIZE < slides.length) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    console.log(`Successfully generated ${blobs.length} slides`);
    return blobs;
  } catch (error) {
    console.error("Error during slide generation:", error);
    throw error;
  }
}

/**
 * Generates a single slide image using Konva on main thread
 *
 * Creates a hidden DOM container, builds Konva stage, exports as blob, then cleans up.
 * This ensures pixel-perfect rendering that matches the template editor.
 *
 * @param slide - The slide configuration
 * @param layout - Layout config with aspect ratio
 * @returns Promise resolving to PNG blob
 */
async function generateSlideImage(
  slide: PostSlide,
  layout: LayoutConfig
): Promise<Blob> {
  // Use shared builder for consistent Konva instance
  const stage = await buildStageForExport(slide, layout.aspect_ratio);
  return await stageToBlob(stage, 1);
}

/**
 * Legacy worker-based generation (deprecated)
 * Kept for reference but not recommended due to Konva DOM requirements
 */
export async function generateSlideImages(
  postContent: PostContent,
  onProgress?: (progress: GenerationProgress) => void
): Promise<GenerationResult[]> {
  return new Promise((resolve, reject) => {
    // ...existing code...
  });
}

/**
 * Creates a post in Supabase, then generates and uploads all slides
 * Ensures postId is available for storage uploads
 *
 * @param postData - The post data (template, profile, content, etc.)
 * @param onProgress - Optional progress callback
 * @returns Promise resolving to { postId, slideUrls }
 */
export async function createPostAndUploadSlides(
  postData: any, // Should match CreatePostInput
  onProgress?: (progress: GenerationProgress) => void
): Promise<{ postId: string; slideUrls: string[] }> {
  // 1. Create post in Supabase to get postId
  const post = await PostRepository.createPost(postData);
  const postId = post.id;

  // 2. Generate slide images
  const results = await generateSlideImages(postData.content, onProgress);

  // 3. Upload slides to Supabase Storage
  const uploadPromises = results.map(({ slideIndex, blob }) =>
    StorageRepository.uploadSlideImage(postId, slideIndex, blob)
  );
  const slideUrls = await Promise.all(uploadPromises);

  // 4. Optionally update post with storage URLs
  await PostRepository.updatePostStorageUrls(
    postId,
    postData.profile.id,
    slideUrls
  );

  return { postId, slideUrls };
}

/**
 * Generates a single slide image (useful for previews)
 *
 * @param template - The template to use
 * @param brand - The brand/profile
 * @returns Promise resolving to Blob
 */
export async function generateSingleSlide(
  template: Template,
  brand: Brand
): Promise<Blob> {
  const brandSettings = brand.brand_settings as unknown as BrandSettings;
  const slideSet = await contentApi.generatePosts(template, brandSettings, 1);

  const results = await generateSlideImages(slideSet[0]);
  return results[0].blob;
}

/**
 * Generates and uploads all slides to Supabase Storage
 *
 * @param postContent - The post content with slides
 * @param postId - The post ID for storage path
 * @param onProgress - Optional progress callback
 * @returns Promise resolving to array of download URLs
 */
export async function generateAndUploadSlides(
  postContent: PostContent,
  postId: string,
  onProgress?: (progress: GenerationProgress) => void
): Promise<string[]> {
  // Generate all slide images
  const results = await generateSlideImages(postContent, onProgress);

  // Upload to Supabase Storage
  const uploadPromises = results.map(({ slideIndex, blob }) =>
    StorageRepository.uploadSlideImage(postId, slideIndex, blob)
  );

  return Promise.all(uploadPromises);
}
