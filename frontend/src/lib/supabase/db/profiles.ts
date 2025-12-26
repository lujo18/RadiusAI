/**
 * Supabase Database Operations - Profiles
 * 
 * Handles all profile-related database operations.
 * Returns raw Supabase types (snake_case) for direct use.
 */

import { supabase } from '../client';
import type { 
  Profile, 
  ProfileInsert,
  ProfileUpdate,
  PlatformIntegration,
  PlatformIntegrationInsert,
  Json
} from '@/types';

// ==================== CREATE ====================

export async function createProfile(brandSettings: Json): Promise<Profile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Generate a unique late_profile_id
  const lateProfileId = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      user_id: user.id,
      late_profile_id: lateProfileId,
      brand_settings: brandSettings,
      template_count: 0,
      post_count: 0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  
  return data;
}

// ==================== READ ====================

export async function getUserProfiles(): Promise<Profile[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return data;
}

export async function getProfile(profileId: string): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(error.message);
  }

  return data;
}

/** Get profile with integrations */
export async function getProfileWithIntegrations(profileId: string): Promise<Profile & { platform_integrations: PlatformIntegration[] } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      platform_integrations(*)
    `)
    .eq('id', profileId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }

  return data as Profile & { platform_integrations: PlatformIntegration[] };
}

// ==================== UPDATE ====================

export async function updateProfile(
  profileId: string,
  updates: ProfileUpdate
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', profileId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

export async function updateBrandSettings(
  profileId: string,
  brandSettings: Json
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('profiles')
    .update({ brand_settings: brandSettings })
    .eq('id', profileId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

// ==================== DELETE ====================

export async function deleteProfile(profileId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', profileId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

// ==================== INTEGRATIONS ====================

export async function getProfileIntegrations(profileId: string): Promise<PlatformIntegration[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('platform_integrations')
    .select('*')
    .eq('profile_id', profileId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);

  return data;
}

export async function addPlatformIntegration(
  profileId: string,
  integration: Omit<PlatformIntegrationInsert, 'user_id' | 'profile_id'>
): Promise<PlatformIntegration> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('platform_integrations')
    .insert({
      ...integration,
      user_id: user.id,
      profile_id: profileId,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
}

export async function removePlatformIntegration(integrationId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('platform_integrations')
    .delete()
    .eq('id', integrationId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

// ==================== ALIASES (for backwards compatibility) ====================

/** @deprecated Use addPlatformIntegration instead */
export const addIntegration = addPlatformIntegration;

/** @deprecated Use removePlatformIntegration instead */
export const removeIntegration = removePlatformIntegration;
