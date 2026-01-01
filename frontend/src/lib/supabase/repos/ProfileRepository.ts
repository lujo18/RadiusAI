import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { supabase } from '../client'

export class ProfileRepository {
  // Get a single profile by id and user
  static async getProfile(profileId: string, userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .eq('user_id', userId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data;
  }

  // Get all profiles for a user
  static async getProfiles(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  // Get a profile with integrations
  static async getProfileWithIntegrations(profileId: string, userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, platform_integrations(*)')
      .eq('id', profileId)
      .eq('user_id', userId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data;
  }

  // Create a new profile
  static async createProfile(profile: Database['public']['Tables']['profiles']['Insert']) {
    const { data, error } = await supabase
      .from('profiles')
      .insert([profile])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  // Update a profile
  static async updateProfile(profileId: string, updates: Partial<Database['public']['Tables']['profiles']['Update']>, userId?: string) {
    let query = supabase
      .from('profiles')
      .update(updates)
      .eq('id', profileId);
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query.select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  // Update brand settings for a profile
  static async updateBrandSettings(profileId: string, userId: string, brandSettings: any) {
    const { error } = await supabase
      .from('profiles')
      .update({ brand_settings: brandSettings })
      .eq('id', profileId)
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    return true;
  }

  // Delete a profile
  static async deleteProfile(profileId: string, userId: string) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profileId)
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    return true;
  }

  // Integrations
  static async getProfileIntegrations(profileId: string, userId: string) {
    const { data, error } = await supabase
      .from('platform_integrations')
      .select('*')
      .eq('profile_id', profileId)
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    return data;
  }

  static async createProfileIntegration(profileId: string, userId: string, integration: any) {
    const { data, error } = await supabase
      .from('platform_integrations')
      .insert({
        ...integration,
        user_id: userId,
        profile_id: profileId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  static async deleteProfileIntegration(integrationId: string, userId: string) {
    const { error } = await supabase
      .from('platform_integrations')
      .delete()
      .eq('id', integrationId)
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    return true;
  }
}
