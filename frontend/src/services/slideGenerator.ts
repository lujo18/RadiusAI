/**
 * Slide Generation Service
 * 
 * High-level API for generating slide images from PostContent.
 * Abstracts worker communication and provides Promise-based interface.
 * 
 * Usage:
 * ```ts
 * const blobs = await generateSlideImages(postContent);
 * // Upload blobs to Firebase Storage
 * ```
 */

import { Template } from "@/types/template";
import { uploadSlideImage } from "../lib/firebase/firestore/index";
import type { PostContent, PostSlide } from '@/types/post';
import { BrandSettings } from "@/types/user";
import { Post } from "@/types";

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

/**
 * Generates slide images from PostContent using a Web Worker
 * 
 * @param postContent - The post content with slides and layout
 * @param onProgress - Optional callback for progress updates
 * @returns Promise resolving to array of {slideIndex, blob} in order
 */
export async function generateSlideImages(
  postContent: PostContent,
  onProgress?: (progress: GenerationProgress) => void
): Promise<GenerationResult[]> {
  return new Promise((resolve, reject) => {
    // Create worker
    const worker = new Worker(
      new URL('./slideGenWorker.ts', import.meta.url),
      { type: 'module' }
    );

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
 * @param slide - The slide to generate
 * @param aspectRatio - The aspect ratio
 * @returns Promise resolving to Blob
 */
export async function generateSingleSlide(
  slide: PostSlide,
  aspectRatio: string
): Promise<Blob> {
  const postContent: PostContent = {
    slides: [slide],
    layout: {
      slideCount: 1,
      aspectRatio: aspectRatio as any,
    },
    caption: '',
    hashtags: [],
  };

  const results = await generateSlideImages(postContent);
  return results[0].blob;
}

/**
 * Generates and uploads all slides to Firebase Storage
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
  
  // Upload to Firebase Storage
  const uploadPromises = results.map(({ slideIndex, blob }) => 
    uploadSlideImage(blob, postId, slideIndex)
  );
  
  return Promise.all(uploadPromises);
}
  
  

export async function generatePosts() {
  // Placeholder for future batch post generation logic
}

/**
 * Call backend and generate a set of filler data based on the template
 * and brand settings
 * @param template the template to use for generation
 * @param brandSettings the brand settings to apply
 * @returns array of Posts created using given template and brandSettings
 */
export async function generatePluginContent(template: Template, brandSettings: BrandSettings): Promise<Post[]> {
  // Placeholder for future plugin-based content generation logic

  const templateStyleConfig = template.styleConfig;

  
 

  return [];

}