import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { supabase } from '../client'
import { TeamRepository } from './TeamRepository';

export class BrandRepository {
  // Get a single brand by id and team
  static async getBrand(brandId: string, teamId: string) {
    const { data, error } = await supabase
      .from('brand')
      .select('*')
      .eq('id', brandId)
      .eq('team_id', teamId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data;
  }

  // Get all brands for a team
  static async getBrands(teamId: string) {
    const { data, error } = await supabase
      .from('brand')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  // Get all accessible brand IDs for current user
  static async getAccessibleBrandIds(): Promise<string[]> {
    try {
      // Get user's teams
      const userTeams = await TeamRepository.getUserTeams();
      console.log('[DEBUG] userTeams from TeamRepository:', userTeams);
      const teamIds = userTeams?.map((t: any) => t.team_id) || [];
      console.log('[DEBUG] teamIds extracted:', teamIds);
      
      if (teamIds.length === 0) {
        console.log('[DEBUG] No teams found, returning empty brand IDs');
        return [];
      }
      
      // Get all brands for those teams
      const { data, error } = await supabase
        .from('brand')
        .select('id')
        .in('team_id', teamIds);
      
      console.log('[DEBUG] Brands query result:', { data, error });
      if (error) throw new Error(error.message);
      const brandIds = (data || []).map((b: any) => b.id);
      console.log('[DEBUG] Accessible brand IDs:', brandIds);
      return brandIds;
    } catch (error) {
      console.error('Error getting accessible brand IDs:', error);
      return [];
    }
  }

  // Get a brand with integrations
  static async getBrandWithIntegrations(brandId: string, teamId: string) {
    const { data, error } = await supabase
      .from('brand')
      .select('*, platform_integrations(*)')
      .eq('id', brandId)
      .eq('team_id', teamId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data;
  }

  // Create a new brand
  static async createBrand(brand: any) {
    const { data, error } = await supabase
      .from('brand')
      .insert([brand])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  // Update a brand
  static async updateBrand(brandId: string, updates: any, userId?: string) {
    let query = supabase
      .from('brand')
      .update(updates)
      .eq('id', brandId);
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query.select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  // Update brand settings for a brand
  static async updateBrandSettings(brandId: string, teamId: string, brandSettings: any) {
    const { error } = await supabase
      .from('brand')
      .update({ brand_settings: brandSettings })
      .eq('id', brandId)
      .eq('team_id', teamId);
    if (error) throw new Error(error.message);
    return true;
  }

  // Delete a brand
  static async deleteBrand(brandId: string, teamId: string) {
    const { error } = await supabase
      .from('brand')
      .delete()
      .eq('id', brandId)
      .eq('team_id', teamId);
    if (error) throw new Error(error.message);
    return true;
  }

  // Integrations
  static async getBrandIntegrations(brandId: string) {
    console.log("brandid", brandId)

    const { data, error } = await supabase
      .from('platform_integrations')
      .select('*')
      .eq('brand_id', brandId);

    if (error) throw new Error(error.message);
    return data || [];
  }

  static async createBrandIntegration(brandId: string, teamId: string, integration: any) {
    const { data, error } = await supabase
      .from('platform_integrations')
      .insert({
        ...integration,
        brand_id: brandId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  static async deleteBrandIntegration(integrationId: string) {
    const { error } = await supabase
      .from('platform_integrations')
      .delete()
      .eq('id', integrationId)
    if (error) throw new Error(error.message);
    return true;
  }
}
