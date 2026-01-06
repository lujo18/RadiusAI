import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { supabase } from '../client'

export class BrandRepository {
  // Get a single brand by id and user
  static async getBrand(brandId: string, userId: string) {
    const { data, error } = await supabase
      .from('brand')
      .select('*')
      .eq('id', brandId)
      .eq('user_id', userId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data;
  }

  // Get all brands for a user
  static async getBrands(userId: string) {
    const { data, error } = await supabase
      .from('brand')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  // Get a brand with integrations
  static async getBrandWithIntegrations(brandId: string, userId: string) {
    const { data, error } = await supabase
      .from('brand')
      .select('*, platform_integrations(*)')
      .eq('id', brandId)
      .eq('user_id', userId)
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
  static async updateBrandSettings(brandId: string, userId: string, brandSettings: any) {
    const { error } = await supabase
      .from('brand')
      .update({ brand_settings: brandSettings })
      .eq('id', brandId)
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    return true;
  }

  // Delete a brand
  static async deleteBrand(brandId: string, userId: string) {
    const { error } = await supabase
      .from('brand')
      .delete()
      .eq('id', brandId)
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    return true;
  }

  // Integrations
  static async getBrandIntegrations(brandId: string, userId: string) {
    const { data, error } = await supabase
      .from('platform_integrations')
      .select('*')
      .eq('brand_id', brandId)
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    return data;
  }

  static async createBrandIntegration(brandId: string, userId: string, integration: any) {
    const { data, error } = await supabase
      .from('platform_integrations')
      .insert({
        ...integration,
        user_id: userId,
        brand_id: brandId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  static async deleteBrandIntegration(integrationId: string, userId: string) {
    const { error } = await supabase
      .from('platform_integrations')
      .delete()
      .eq('id', integrationId)
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    return true;
  }
}
