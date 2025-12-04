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
    profileId: `profile_${Date.now()}`,
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
    ...doc.data(),
    createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
  })) as UserProfile[];
}

export async function getProfile(profileId: string): Promise<UserProfile | null> {
  const userId = requireUid();
  if (!userId) throw new Error('User not authenticated');

  const profilesRef = collection(db, `users/${userId}/profiles`);
  const q = query(profilesRef, where('profileId', '==', profileId));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return {
    ...doc.data(),
    createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
  } as UserProfile;
}

// ==================== UPDATE ====================

export async function updateProfile(
  profileId: string,
  updates: Partial<Omit<UserProfile, 'userId' | 'profileId' | 'createdAt'>>
): Promise<void> {
  const userId = requireUid();
  if (!userId) throw new Error('User not authenticated');

  const profilesRef = collection(db, `users/${userId}/profiles`);
  const q = query(profilesRef, where('profileId', '==', profileId));
  const snapshot = await getDocs(q);

  if (snapshot.empty) throw new Error('Profile not found');

  const docRef = snapshot.docs[0].ref;
  await updateDoc(docRef, updates);
}

export async function updateBrandSettings(
  profileId: string,
  brandSettings: BrandSettings
): Promise<void> {
  await updateProfile(profileId, { brandSettings });
}

// ==================== DELETE ====================

export async function deleteProfile(profileId: string): Promise<void> {
  const userId = requireUid();
  if (!userId) throw new Error('User not authenticated');

  const profilesRef = collection(db, `users/${userId}/profiles`);
  const q = query(profilesRef, where('profileId', '==', profileId));
  const snapshot = await getDocs(q);

  if (snapshot.empty) throw new Error('Profile not found');

  const docRef = snapshot.docs[0].ref;
  await deleteDoc(docRef);
}

// ==================== INTEGRATIONS ====================

export async function addIntegration(
  profileId: string,
  integration: PlatformIntegration
): Promise<void> {
  const profile = await getProfile(profileId);
  if (!profile) throw new Error('Profile not found');

  const updatedIntegrations = [...profile.integrations, integration];
  await updateProfile(profileId, { integrations: updatedIntegrations });
}

export async function removeIntegration(
  profileId: string,
  integrationId: string
): Promise<void> {
  const profile = await getProfile(profileId);
  if (!profile) throw new Error('Profile not found');

  const updatedIntegrations = profile.integrations.filter(
    i => i.id !== integrationId
  );
  await updateProfile(profileId, { integrations: updatedIntegrations });
}
