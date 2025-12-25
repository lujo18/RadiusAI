/**
 * Supabase Database Operations - Profiles
 * 
 * Handles all profile-related database operations
 */

import { supabase } from '../client';
import type { UserProfile, BrandSettings, PlatformIntegration } from '@/types/user';

// Type assertion for database operations until types are regenerated
type DbProfile = {
  id: string;
  user_id: string;
  brand_settings: any;
  template_count: number;
  post_count: number;
  created_at: string;
  updated_at: string;
};

type DbIntegration = {
  id: string;
  user_id: string;
  platform: string;
  username: string;
  full_name: string;
  profile_picture_url: string;
  followers_count: number;
  following_count: number;
  bio: string;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string;
  created_at: string;
  updated_at: string;
};

// ==================== CREATE ====================

export async function createProfile(brandSettings: BrandSettings): Promise<UserProfile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      user_id: user.id,
      brand_settings: brandSettings as any,
      template_count: 0,
      post_count: 0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  
  const profile = data as DbProfile;

  return {
    id: profile.id,
    userId: profile.user_id,
    brandSettings: profile.brand_settings as BrandSettings,
    integrations: [],
    templateCount: profile.template_count,
    postCount: profile.post_count,
    createdAt: new Date(profile.created_at),
  };
}

// ==================== READ ====================

export async function getUserProfiles(): Promise<UserProfile[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data as DbProfile[]).map(profile => ({
    id: profile.id,
    userId: profile.user_id,
    brandSettings: profile.brand_settings as BrandSettings,
    integrations: [], // TODO: Load integrations separately
    templateCount: profile.template_count,
    postCount: profile.post_count,
    createdAt: new Date(profile.created_at),
  }));
}

export async function getProfile(profileId: string): Promise<UserProfile | null> {
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

  const profile = data as DbProfile;

  return {
    id: profile.id,
    userId: profile.user_id,
    brandSettings: profile.brand_settings as BrandSettings,
    integrations: [], // TODO: Load integrations separately
    templateCount: profile.template_count,
    postCount: profile.post_count,
    createdAt: new Date(profile.created_at),
  };
}

// ==================== UPDATE ====================

export async function updateProfile(
  profileId: string,
  updates: Partial<UserProfile>
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const updateData: any = {};
  
  if (updates.brandSettings) {
    updateData.brand_settings = updates.brandSettings;
  }
  if (updates.templateCount !== undefined) {
    updateData.template_count = updates.templateCount;
  }
  if (updates.postCount !== undefined) {
    updateData.post_count = updates.postCount;
  }

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', profileId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

export async function updateBrandSettings(
  profileId: string,
  brandSettings: BrandSettings
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('profiles')
    .update({ brand_settings: brandSettings as any })
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

  return data.map(integration => ({
    id: integration.id,
    userId: integration.user_id,
    platform: integration.platform,
    username: integration.username,
    fullName: integration.full_name || '',
    profilePictureUrl: integration.profile_picture_url || '',
    followersCount: integration.followers_count,
    followingCount: integration.following_count,
    bio: integration.bio || '',
    websiteUrl: integration.website_url || undefined,
    isBusinessAccount: integration.is_business_account,
  }));
}

export async function addPlatformIntegration(
  profileId: string,
  integration: Omit<PlatformIntegration, 'id' | 'userId'>
): Promise<PlatformIntegration> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('platform_integrations')
    .insert({
      user_id: user.id,
      profile_id: profileId,
      platform: integration.platform,
      username: integration.username,
      full_name: integration.fullName,
      profile_picture_url: integration.profilePictureUrl,
      followers_count: integration.followersCount,
      following_count: integration.followingCount,
      bio: integration.bio,
      website_url: integration.websiteUrl,
      is_business_account: integration.isBusinessAccount,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    userId: data.user_id,
    platform: data.platform,
    username: data.username,
    fullName: data.full_name || '',
    profilePictureUrl: data.profile_picture_url || '',
    followersCount: data.followers_count,
    followingCount: data.following_count,
    bio: data.bio || '',
    websiteUrl: data.website_url || undefined,
    isBusinessAccount: data.is_business_account,
  };
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

/**
 * Alias for addPlatformIntegration
 * @deprecated Use addPlatformIntegration instead
 */
export async function addIntegration(
  profileId: string,
  integration: Omit<PlatformIntegration, 'id' | 'userId'>
): Promise<PlatformIntegration> {
  return addPlatformIntegration(profileId, integration);
}

/**
 * Alias for removePlatformIntegration
 * @deprecated Use removePlatformIntegration instead
 */
export async function removeIntegration(integrationId: string): Promise<void> {
  return removePlatformIntegration(integrationId);
}
