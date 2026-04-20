import { supabase } from '../client';

const DEFAULT_IMAGE_TYPE = 'image/avif';
const FALLBACK_IMAGE_TYPE = 'image/webp';

function getExtensionFromMime(contentType: string): string {
  switch (contentType) {
    case 'image/avif':
      return 'avif';
    default:
      return 'webp';
  }
}

export class StorageRepository {
  // Upload a single slide image
  static async uploadSlideImage(postId: string, slideIndex: number, blob: Blob): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const contentType = blob.type || FALLBACK_IMAGE_TYPE;
    const extension = getExtensionFromMime(contentType);
    const fileName = `${user.id}/${postId}/slide-${slideIndex}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('slides')
      .upload(fileName, blob, {
        contentType,
        upsert: true,
      });
    if (uploadError) throw new Error(uploadError.message);
    const { data } = supabase.storage.from('slides').getPublicUrl(fileName);
    return data.publicUrl;
  }

  // Upload multiple slide images
  static async uploadSlideImages(postId: string, blobs: Blob[]): Promise<string[]> {
    const uploadPromises = blobs.map((blob, index) =>
      StorageRepository.uploadSlideImage(postId, index, blob)
    );
    return await Promise.all(uploadPromises);
  }

  // Delete all slide images for a post
  static async deleteSlideImages(postId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    const folderPath = `${user.id}/${postId}/`;
    const { data: files, error: listError } = await supabase.storage
      .from('slides')
      .list(folderPath);
    if (listError) throw new Error(listError.message);
    if (!files || files.length === 0) return;
    const filePaths = files.map(file => `${folderPath}${file.name}`);
    const { error: deleteError } = await supabase.storage
      .from('slides')
      .remove(filePaths);
    if (deleteError) throw new Error(deleteError.message);
  }

  // Get a public URL for a slide image
  static getSlideImageUrl(postId: string, slideIndex: number, userId: string): string {
    const fileName = `${userId}/${postId}/slide-${slideIndex}.avif`;
    const { data } = supabase.storage.from('slides').getPublicUrl(fileName);
    return data.publicUrl;
  }

  // Upload a thumbnail image
  static async uploadThumbnail(postId: string, blob: Blob): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const contentType = blob.type || FALLBACK_IMAGE_TYPE;
    const extension = getExtensionFromMime(contentType);
    const fileName = `${user.id}/${postId}/thumbnail.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('slides')
      .upload(fileName, blob, {
        contentType,
        upsert: true,
      });
    if (uploadError) throw new Error(uploadError.message);
    const { data } = supabase.storage.from('slides').getPublicUrl(fileName);
    return data.publicUrl;
  }

  // Generate a thumbnail from the first slide
  static async generateThumbnail(firstSlideBlob: Blob): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      img.onload = () => {
        canvas.width = 300;
        canvas.height = 300;
        ctx.drawImage(img, 0, 0, 300, 300);

        canvas.toBlob((avifBlob) => {
          if (avifBlob) {
            resolve(avifBlob);
            return;
          }

          canvas.toBlob((webpBlob) => {
            if (webpBlob) {
              resolve(webpBlob);
            } else {
              reject(new Error('Failed to generate thumbnail'));
            }
          }, FALLBACK_IMAGE_TYPE);
        }, DEFAULT_IMAGE_TYPE);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(firstSlideBlob);
    });
  }

  // Upload all slides and generate/upload thumbnail
  static async uploadPostImages(postId: string, blobs: Blob[]): Promise<{ slideUrls: string[]; thumbnailUrl: string }> {
    const slideUrls = await StorageRepository.uploadSlideImages(postId, blobs);
    const thumbnail = await StorageRepository.generateThumbnail(blobs[0]);
    const thumbnailUrl = await StorageRepository.uploadThumbnail(postId, thumbnail);
    return { slideUrls, thumbnailUrl };
  }

  // (Future) Upload a video file for a post
  static async uploadVideo(postId: string, blob: Blob): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    const fileName = `${user.id}/${postId}/video.mp4`;
    const { error: uploadError } = await supabase.storage
      .from('slides') // Or a separate 'videos' bucket if desired
      .upload(fileName, blob, {
        contentType: 'video/mp4',
        upsert: true,
      });
    if (uploadError) throw new Error(uploadError.message);
    const { data } = supabase.storage.from('slides').getPublicUrl(fileName);
    return data.publicUrl;
  }
}
