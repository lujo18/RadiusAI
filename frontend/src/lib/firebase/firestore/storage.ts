// Storage Operations for Firebase Storage

import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll
} from 'firebase/storage';
import { storage } from '../firebaseConfig';
import { requireUid } from '../auth';

/**
 * Upload a slide image to Firebase Storage
 */
export async function uploadSlideImage(
  file: File | Blob,
  templateId: string,
  slideIndex: number
): Promise<string> {
  try {
    const userId = requireUid();
    const timestamp = Date.now();
    const fileName = `${userId}/${templateId}/slide_${slideIndex}_${timestamp}.png`;
    const storageRef = ref(storage, `slides/${fileName}`);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading slide image:', error);
    throw error;
  }
}

/**
 * Upload multiple slide images at once
 */
export async function uploadSlideImages(
  files: (File | Blob)[],
  templateId: string
): Promise<string[]> {
  try {
    const uploadPromises = files.map((file, index) => 
      uploadSlideImage(file, templateId, index)
    );
    
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading slide images:', error);
    throw error;
  }
}

/**
 * Delete a slide image from Firebase Storage
 */
export async function deleteSlideImage(imageUrl: string): Promise<void> {
  try {
    // Extract the file path from the download URL
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
    
    if (!pathMatch) {
      throw new Error('Invalid image URL format');
    }
    
    const filePath = decodeURIComponent(pathMatch[1]);
    const storageRef = ref(storage, filePath);
    
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting slide image:', error);
    throw error;
  }
}

/**
 * Delete all slide images for a template
 */
export async function deleteTemplateSlideImages(templateId: string): Promise<void> {
  try {
    const userId = requireUid();
    const folderRef = ref(storage, `slides/${userId}/${templateId}`);
    
    // List all files in the template folder
    const fileList = await listAll(folderRef);
    
    // Delete all files
    const deletePromises = fileList.items.map(item => deleteObject(item));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting template slide images:', error);
    throw error;
  }
}

/**
 * Upload a user profile image
 */
export async function uploadProfileImage(file: File | Blob): Promise<string> {
  try {
    const userId = requireUid();
    const timestamp = Date.now();
    const fileName = `${userId}/profile_${timestamp}.png`;
    const storageRef = ref(storage, `profiles/${fileName}`);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw error;
  }
}

/**
 * Upload a brand logo
 */
export async function uploadBrandLogo(file: File | Blob): Promise<string> {
  try {
    const userId = requireUid();
    const timestamp = Date.now();
    const fileName = `${userId}/logo_${timestamp}.png`;
    const storageRef = ref(storage, `logos/${fileName}`);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading brand logo:', error);
    throw error;
  }
}

/**
 * Delete an image by URL (generic)
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    await deleteSlideImage(imageUrl); // Uses same logic
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}

/**
 * Get all slide image URLs for a template
 */
export async function getTemplateSlideImages(templateId: string): Promise<string[]> {
  try {
    const userId = requireUid();
    const folderRef = ref(storage, `slides/${userId}/${templateId}`);
    
    // List all files in the template folder
    const fileList = await listAll(folderRef);
    
    // Get download URLs for all files
    const urlPromises = fileList.items.map(item => getDownloadURL(item));
    return await Promise.all(urlPromises);
  } catch (error) {
    console.error('Error getting template slide images:', error);
    throw error;
  }
}
