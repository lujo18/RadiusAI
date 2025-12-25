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

import { Template, ASPECT_RATIOS } from "@/types/template";
import { uploadSlideImage } from "../lib/supabase/db/index";
import type { PostContent, PostSlide } from "@/types/post";
import { BrandSettings, UserProfile } from "@/types/user";
import { Post } from "@/types";
import { contentApi } from "@/lib/api/client";
import Konva from 'konva';
import type { LayoutConfig } from "@/types/template";

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

export async function createPostsFromTemplate(
  template: Template,
  profile: UserProfile,
  count: number = 1
): Promise<Blob[]> {
  const brandSettings = profile.brandSettings as BrandSettings;

  console.log("Generating posts");
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
  postContent: PostContent,
  onProgress?: (progress: GenerationProgress) => void
): Promise<Blob[]> {
  const { slides, layout } = postContent;
  const totalSlides = slides.length;
  const blobs: Blob[] = [];
  
  console.log(`Starting generation of ${totalSlides} slides on main thread`);

  // Process slides in small batches to keep UI responsive
  const BATCH_SIZE = 3;
  
  for (let i = 0; i < slides.length; i += BATCH_SIZE) {
    const batch = slides.slice(i, Math.min(i + BATCH_SIZE, slides.length));
    
    // Generate batch in parallel
    const batchBlobs = await Promise.all(
      batch.map(async (slide) => {
        try {
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
          console.error(`Failed to generate slide ${slide.slideNumber}:`, error);
          throw error;
        }
      })
    );
    
    blobs.push(...batchBlobs);
    
    // Yield to UI thread between batches
    if (i + BATCH_SIZE < slides.length) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  console.log(`Successfully generated ${blobs.length} slides`);
  return blobs;
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
  const dimensions = ASPECT_RATIOS[layout.aspectRatio];
  
  // Create hidden container (required by Konva for DOM canvas)
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = `${dimensions.width}px`;
  container.style.height = `${dimensions.height}px`;
  document.body.appendChild(container);
  
  try {
    // Create Konva stage
    const stage = new Konva.Stage({
      container,
      width: dimensions.width,
      height: dimensions.height,
    });
    
    // Build background layer
    const backgroundLayer = new Konva.Layer();
    const background = slide.background;
    
    if (background.type === 'solid' && background.color) {
      const rect = new Konva.Rect({
        x: 0,
        y: 0,
        width: dimensions.width,
        height: dimensions.height,
        fill: background.color,
      });
      backgroundLayer.add(rect);
    } else if (background.type === 'gradient' && background.gradientColors) {
      const [color1, color2] = background.gradientColors;
      const angle = background.gradientAngle || 0;
      
      const radians = (angle * Math.PI) / 180;
      const x1 = dimensions.width / 2 - (Math.cos(radians) * dimensions.width) / 2;
      const y1 = dimensions.height / 2 - (Math.sin(radians) * dimensions.height) / 2;
      const x2 = dimensions.width / 2 + (Math.cos(radians) * dimensions.width) / 2;
      const y2 = dimensions.height / 2 + (Math.sin(radians) * dimensions.height) / 2;
      
      const rect = new Konva.Rect({
        x: 0,
        y: 0,
        width: dimensions.width,
        height: dimensions.height,
        fillLinearGradientStartPoint: { x: x1, y: y1 },
        fillLinearGradientEndPoint: { x: x2, y: y2 },
        fillLinearGradientColorStops: [0, color1, 1, color2],
      });
      backgroundLayer.add(rect);
    }
    
    stage.add(backgroundLayer);
    
    // Build content layer with text elements
    const contentLayer = new Konva.Layer();
    slide.elements.forEach((element) => {
      if (element.type === 'text') {
        const textNode = new Konva.Text({
          id: element.id,
          text: element.content,
          x: element.x,
          y: element.y,
          width: element.width,
          fontSize: element.fontSize,
          fontFamily: element.fontFamily,
          fontStyle: element.fontStyle,
          fill: element.color,
          align: element.align,
        });
        contentLayer.add(textNode);
      }
    });
    
    stage.add(contentLayer);
    
    // Export as blob with high DPI
    const blob = await new Promise<Blob>((resolve, reject) => {
      stage.toBlob({
        callback: (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert stage to blob'));
          }
        },
        mimeType: 'image/png',
        quality: 1,
        pixelRatio: 2, // High DPI for quality
      });
    });
    
    // Cleanup
    stage.destroy();
    document.body.removeChild(container);
    
    return blob;
    
  } catch (error) {
    // Ensure cleanup even on error
    if (container.parentNode) {
      document.body.removeChild(container);
    }
    throw error;
  }
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
    // Create worker
    const worker = new Worker(new URL("./slideGenWorker.ts", import.meta.url), {
      type: "module",
    });

    const results: GenerationResult[] = [];
    const errors: GenerationError[] = [];
    const totalSlides = postContent.slides.length;

    worker.onmessage = (e: MessageEvent) => {
      const { slideIndex, blob, error, progress } = e.data;

      if (error) {
        // Collect errors
        errors.push({ slideIndex, error });

        // Check if all slides processed (success or failure)
        if (results.length + errors.length === totalSlides) {
          worker.terminate();
          if (errors.length === totalSlides) {
            // All failed
            reject(new Error(`All slides failed: ${errors[0].error}`));
          } else {
            // Some succeeded - return what we have
            resolve(results.sort((a, b) => a.slideIndex - b.slideIndex));
          }
        }
        return;
      }

      if (blob) {
        // Collect successful result
        results.push({ slideIndex, blob });

        // Notify progress
        if (onProgress && progress !== undefined) {
          onProgress({
            slideIndex,
            progress,
            total: totalSlides,
          });
        }

        // Check if all slides completed
        if (results.length === totalSlides) {
          worker.terminate();
          // Sort by slide index to maintain order
          resolve(results.sort((a, b) => a.slideIndex - b.slideIndex));
        }
      }
    };

    worker.onerror = (error) => {
      worker.terminate();
      reject(new Error(`Worker error: ${error.message}`));
    };

    // Send PostContent to worker
    worker.postMessage({
      postContent,
      pixelRatio: 2, // High DPI
    });
  });
}

/**
 * Generates a single slide image (useful for previews)
 *
 * @param template - The template to use
 * @param profile - The user profile
 * @returns Promise resolving to Blob
 */
export async function generateSingleSlide(
  template: Template,
  profile: UserProfile
): Promise<Blob> {
  const slideSet = await contentApi.generatePosts(
    template,
    profile.brandSettings as BrandSettings,
    1
  );

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
    uploadSlideImage(postId, slideIndex, blob)
  );

  return Promise.all(uploadPromises);
}
