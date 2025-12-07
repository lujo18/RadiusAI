// Firebase Firestore operations for User Profiles

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import type { UserProfile, BrandSettings, PlatformIntegration } from '@/types/user';
import { requireUid } from '../auth';

// ==================== CREATE ====================

export async function createProfile(brandSettings: BrandSettings): Promise<UserProfile> {
  const userId = requireUid();
  if (!userId) throw new Error('User not authenticated');

  const profileData = {
    userId,
    brandSettings,
    integrations: [],
    templateCount: 0,
    postCount: 0,
    createdAt: serverTimestamp(),
  };

  const profilesRef = collection(db, `users/${userId}/profiles`);
  const docRef = await addDoc(profilesRef, profileData);

  return {
    id: docRef.id,
    ...profileData,
    createdAt: new Date(),
  } as UserProfile;
}

// ==================== READ ====================

export async function getUserProfiles(): Promise<UserProfile[]> {
  const userId = requireUid();
  if (!userId) throw new Error('User not authenticated');

  const profilesRef = collection(db, `users/${userId}/profiles`);
  const snapshot = await getDocs(profilesRef);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
  })) as UserProfile[];
}

export async function getProfile(id: string): Promise<UserProfile | null> {
  const userId = requireUid();
  if (!userId) throw new Error('User not authenticated');

  const profileRef = doc(db, 'users', userId, 'profiles', id);
  const snapshot = await getDoc(profileRef);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
    createdAt: (snapshot.data().createdAt as Timestamp)?.toDate() || new Date(),
  } as UserProfile;
}

// ==================== UPDATE ====================

export async function updateProfile(
  id: string,
  updates: Partial<Omit<UserProfile, 'userId' | 'id' | 'createdAt'>>
): Promise<void> {
  const userId = requireUid();
  if (!userId) throw new Error('User not authenticated');

  const profilesRef = doc(db, 'users', userId, 'profiles', id);
  await updateDoc(profilesRef, updates);
}

export async function updateBrandSettings(
  id: string,
  brandSettings: BrandSettings
): Promise<void> {
  await updateProfile(id, { brandSettings });
}

// ==================== DELETE ====================

export async function deleteProfile(id: string): Promise<void> {
  const userId = requireUid();
  if (!userId) throw new Error('User not authenticated');
 
  const profilesRef = doc(db, 'users', userId, 'profiles', id);
  await deleteDoc(profilesRef);
}

// ==================== INTEGRATIONS ====================

export async function addIntegration(
  id: string,
  integration: PlatformIntegration
): Promise<void> {
  const profile = await getProfile(id);
  if (!profile) throw new Error('Profile not found');

  const updatedIntegrations = [...profile.integrations, integration];
  await updateProfile(id, { integrations: updatedIntegrations });
}

export async function removeIntegration(
  id: string,
  integrationId: string
): Promise<void> {
  const profile = await getProfile(id);
  if (!profile) throw new Error('Profile not found');

  const updatedIntegrations = profile.integrations.filter(
    i => i.id !== integrationId
  );
  await updateProfile(id, { integrations: updatedIntegrations });
}
