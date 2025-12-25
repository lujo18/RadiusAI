/**
 * Supabase Storage Operations
 * 
 * Handles all file upload/download operations using Supabase Storage
 */

import { supabase } from '../client';

// ==================== SLIDE IMAGES ====================

/**
 * Upload a slide image to Supabase Storage
 * 
 * @param postId - The post ID
 * @param slideIndex - The slide index (0-based)
 * @param blob - The image blob
 * @returns Public URL of the uploaded image
 */
export async function uploadSlideImage(
  postId: string,
  slideIndex: number,
  blob: Blob
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const fileName = `${user.id}/${postId}/slide-${slideIndex}.png`;

  const { error: uploadError } = await supabase.storage
    .from('slides')
    .upload(fileName, blob, {
      contentType: 'image/png',
      upsert: true, // Replace if exists
    });

  if (uploadError) throw new Error(uploadError.message);

  // Get public URL
  const { data } = supabase.storage
    .from('slides')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

/**
 * Upload multiple slide images
 * 
 * @param postId - The post ID
 * @param blobs - Array of image blobs
 * @returns Array of public URLs
 */
export async function uploadSlideImages(
  postId: string,
  blobs: Blob[]
): Promise<string[]> {
  const uploadPromises = blobs.map((blob, index) =>
    uploadSlideImage(postId, index, blob)
  );

  return await Promise.all(uploadPromises);
}

/**
 * Delete slide images for a post
 * 
 * @param postId - The post ID
 */
export async function deleteSlideImages(postId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const folderPath = `${user.id}/${postId}/`;

  // List all files in the folder
  const { data: files, error: listError } = await supabase.storage
    .from('slides')
    .list(folderPath);

  if (listError) throw new Error(listError.message);

  if (!files || files.length === 0) return;

  // Delete all files
  const filePaths = files.map(file => `${folderPath}${file.name}`);

  const { error: deleteError } = await supabase.storage
    .from('slides')
    .remove(filePaths);

  if (deleteError) throw new Error(deleteError.message);
}

/**
 * Get slide image URL
 * 
 * @param postId - The post ID
 * @param slideIndex - The slide index
 * @returns Public URL of the image
 */
export function getSlideImageUrl(postId: string, slideIndex: number): string {
  const { data: { user } } = supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const fileName = `${user.id}/${postId}/slide-${slideIndex}.png`;

  const { data } = supabase.storage
    .from('slides')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

// ==================== THUMBNAILS ====================

/**
 * Upload a thumbnail image
 * 
 * @param postId - The post ID
 * @param blob - The thumbnail blob
 * @returns Public URL of the thumbnail
 */
export async function uploadThumbnail(
  postId: string,
  blob: Blob
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const fileName = `${user.id}/${postId}/thumbnail.png`;

  const { error: uploadError } = await supabase.storage
    .from('slides')
    .upload(fileName, blob, {
      contentType: 'image/png',
      upsert: true,
    });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage
    .from('slides')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate thumbnail from first slide
 * 
 * @param firstSlideBlob - The first slide blob
 * @returns Resized thumbnail blob
 */
export async function generateThumbnail(firstSlideBlob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    img.onload = () => {
      // Resize to 300x300 thumbnail
      canvas.width = 300;
      canvas.height = 300;
      ctx.drawImage(img, 0, 0, 300, 300);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to generate thumbnail'));
        }
      }, 'image/png');
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(firstSlideBlob);
  });
}

/**
 * Upload slides and generate thumbnail
 * 
 * @param postId - The post ID
 * @param blobs - Array of slide blobs
 * @returns Object with slide URLs and thumbnail URL
 */
export async function uploadPostImages(
  postId: string,
  blobs: Blob[]
): Promise<{ slideUrls: string[]; thumbnailUrl: string }> {
  // Upload all slides
  const slideUrls = await uploadSlideImages(postId, blobs);

  // Generate and upload thumbnail from first slide
  const thumbnail = await generateThumbnail(blobs[0]);
  const thumbnailUrl = await uploadThumbnail(postId, thumbnail);

  return { slideUrls, thumbnailUrl };
}
