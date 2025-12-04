// Template CRUD Operations

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import type { 
  Template, 
  CreateTemplateInput, 
  UpdateTemplateInput
} from '@/types/template';
import { requireUid } from '../auth';

/**
 * Create a new template
 */
export async function createTemplate(input: CreateTemplateInput): Promise<string> {
  try {
    const userId = requireUid();
    const templateData = {
      name: input.name,
      category: input.category,
      isDefault: input.isDefault || false,
      status: 'active' as const,
      styleConfig: input.styleConfig,
      performance: {
        totalPosts: 0,
        avgEngagementRate: 0,
        avgSaves: 0,
        avgShares: 0,
        avgImpressions: 0,
        lastUpdated: null
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'users', userId, 'templates'), templateData);
    
    // If this is set as default, unset all other defaults for this user
    if (input.isDefault) {
      await setTemplateAsDefault(userId, docRef.id);
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
}

/**
 * Get a single template by ID
 */
export async function getTemplate(templateId: string): Promise<Template | null> {
  try {
    const userId = requireUid();
    const docRef = doc(db, 'users', userId, 'templates', templateId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate(),
        updatedAt: docSnap.data().updatedAt?.toDate(),
        performance: {
          ...docSnap.data().performance,
          lastUpdated: docSnap.data().performance.lastUpdated?.toDate() || null
        }
      } as Template;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting template:', error);
    throw error;
  }
}

/**
 * Get all templates for a user
 */
export async function getUserTemplates(userId: string): Promise<Template[]> {
  try {
    const q = query(
      collection(db, 'users', userId, 'templates'),
      where('status', '!=', 'archived'),
      orderBy('status'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const templates: Template[] = [];
    
    querySnapshot.forEach((doc) => {
      templates.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        performance: {
          ...doc.data().performance,
          lastUpdated: doc.data().performance.lastUpdated?.toDate() || null
        }
      } as Template);
    });
    
    return templates;
  } catch (error) {
    console.error('Error getting user templates:', error);
    throw error;
  }
}

/**
 * Update a template
 */
export async function updateTemplate(
  templateId: string, 
  updates: UpdateTemplateInput
): Promise<void> {
  try {
    const userId = requireUid();
    const docRef = doc(db, 'users', userId, 'templates', templateId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
}

/**
 * Delete a template (soft delete by archiving)
 */
export async function deleteTemplate(templateId: string): Promise<void> {
  try {
    await updateTemplate(templateId, { status: 'archived' });
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
}

/**
 * Set a template as the default for a user
 */
export async function setTemplateAsDefault(userId: string, templateId: string): Promise<void> {
  try {
    // First, unset all other defaults for this user
    const q = query(
      collection(db, 'users', userId, 'templates'),
      where('isDefault', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const batch: Promise<void>[] = [];
    
    querySnapshot.forEach((docSnapshot) => {
      if (docSnapshot.id !== templateId) {
        batch.push(updateDoc(doc(db, 'users', userId, 'templates', docSnapshot.id), { isDefault: false }));
      }
    });
    
    await Promise.all(batch);
    
    // Set the new default
    await updateDoc(doc(db, 'users', userId, 'templates', templateId), { isDefault: true });
  } catch (error) {
    console.error('Error setting template as default:', error);
    throw error;
  }
}

/**
 * Clone an existing template
 */
export async function cloneTemplate(
  templateId: string, 
  newName: string
): Promise<string> {
  try {
    const userId = requireUid();
    const original = await getTemplate(templateId);
    if (!original) {
      throw new Error('Template not found');
    }
    
    const cloneData: CreateTemplateInput = {
      name: newName,
      category: original.category,
      styleConfig: original.styleConfig,
      isDefault: false
    };
    
    const newId = await createTemplate(cloneData);
    
    // Add parent reference
    await updateDoc(doc(db, 'users', userId, 'templates', newId), {
      parentTemplateId: templateId
    });
    
    return newId;
  } catch (error) {
    console.error('Error cloning template:', error);
    throw error;
  }
}
