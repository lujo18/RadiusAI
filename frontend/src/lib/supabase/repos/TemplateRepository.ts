import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { Database } from '@/types/database';
import { TemplateSchema } from '@/types';
import { supabase } from '../client'

export class TemplateRepository {
  static async getTemplate(templateId: string, userId?: string) {
    let query = supabase
      .from('templates')
      .select('*')
      .eq('id', templateId);
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query.single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data ? TemplateSchema.parse(data) : null;
  }

  static async getTemplates(userId: string) {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((t) => TemplateSchema.parse(t));
  }

  static async getTemplatesByCategory(userId: string, category: string) {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((t) => TemplateSchema.parse(t));
  }

  static async getFavoriteTemplates(userId: string) {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('user_id', userId)
      .eq('favorite', true)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((t) => TemplateSchema.parse(t));
  }

  static async createTemplate(userId: string, template: z.infer<typeof TemplateSchema>) {
    console.log("Supabase Creating Template", template);

    const { data, error } = await supabase
      .from('templates')
      .insert([{ ...template, user_id: userId }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return TemplateSchema.parse(data);
  }

  static async updateTemplate(templateId: string, updates: Partial<z.infer<typeof TemplateSchema>>, userId?: string) {
    let query = supabase
      .from('templates')
      .update(updates)
      .eq('id', templateId);
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query.select().single();
    if (error) throw new Error(error.message);
    return TemplateSchema.parse(data);
  }

  static async deleteTemplate(templateId: string, userId?: string) {
    let query = supabase
      .from('templates')
      .delete()
      .eq('id', templateId);
    if (userId) query = query.eq('user_id', userId);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return true;
  }

  static async toggleTemplateFavorite(templateId: string, favorite: boolean, userId: string) {
    const { error } = await supabase
      .from('templates')
      .update({ favorite })
      .eq('id', templateId)
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    return true;
  }

  static async setDefaultTemplate(templateId: string, userId: string) {
    // Unset any existing default
    await supabase
      .from('templates')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true);
    // Set new default
    const { error } = await supabase
      .from('templates')
      .update({ is_default: true })
      .eq('id', templateId)
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    return true;
  }

  static async getTemplatePerformance(templateId: string, userId: string) {
    // First verify user owns the template
    const { data: template } = await supabase
      .from('templates')
      .select('id')
      .eq('id', templateId)
      .eq('user_id', userId)
      .single();
    if (!template) return null;
    const { data, error } = await supabase
      .from('template_performance')
      .select('*')
      .eq('template_id', templateId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data;
  }

  static async getTemplatesByBrand(brandId: string, userId: string) {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('brand_id', brandId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    console.log("gtbb out", data, error);

    if (error) throw new Error(error.message);
    return (data || []).map((t) => TemplateSchema.parse(t));
  }
}
