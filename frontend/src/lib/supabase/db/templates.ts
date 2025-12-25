/**
 * Supabase Database Operations - Templates
 * 
 * Handles all template-related database operations
 */

import { supabase } from '../client';
import type { Template, TemplatePerformance } from '@/types/template';

// ==================== CREATE ====================

export async function createTemplate(template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): Promise<Template> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('templates')
    .insert({
      user_id: user.id,
      profile_id: template.profileId || null,
      name: template.name,
      is_default: template.isDefault,
      category: template.category,
      status: template.status || 'active',
      style_config: template.styleConfig as any,
      tags: template.tags || [],
      favorite: template.favorite || false,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    userId: data.user_id,
    profileId: data.profile_id || undefined,
    name: data.name,
    isDefault: data.is_default,
    category: data.category,
    status: data.status,
    styleConfig: data.style_config as any,
    tags: data.tags,
    favorite: data.favorite,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

// ==================== READ ====================

export async function getUserTemplates(): Promise<Template[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return data.map(template => ({
    id: template.id,
    userId: template.user_id,
    profileId: template.profile_id || undefined,
    name: template.name,
    isDefault: template.is_default,
    category: template.category,
    status: template.status,
    styleConfig: template.style_config as any,
    tags: template.tags,
    favorite: template.favorite,
    createdAt: new Date(template.created_at),
    updatedAt: new Date(template.updated_at),
  }));
}

export async function getTemplate(templateId: string): Promise<Template | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', templateId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }

  return {
    id: data.id,
    userId: data.user_id,
    profileId: data.profile_id || undefined,
    name: data.name,
    isDefault: data.is_default,
    category: data.category,
    status: data.status,
    styleConfig: data.style_config as any,
    tags: data.tags,
    favorite: data.favorite,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

export async function getTemplatesByCategory(category: string): Promise<Template[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('user_id', user.id)
    .eq('category', category)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return data.map(template => ({
    id: template.id,
    userId: template.user_id,
    profileId: template.profile_id || undefined,
    name: template.name,
    isDefault: template.is_default,
    category: template.category,
    status: template.status,
    styleConfig: template.style_config as any,
    tags: template.tags,
    favorite: template.favorite,
    createdAt: new Date(template.created_at),
    updatedAt: new Date(template.updated_at),
  }));
}

export async function getFavoriteTemplates(): Promise<Template[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('user_id', user.id)
    .eq('favorite', true)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return data.map(template => ({
    id: template.id,
    userId: template.user_id,
    profileId: template.profile_id || undefined,
    name: template.name,
    isDefault: template.is_default,
    category: template.category,
    status: template.status,
    styleConfig: template.style_config as any,
    tags: template.tags,
    favorite: template.favorite,
    createdAt: new Date(template.created_at),
    updatedAt: new Date(template.updated_at),
  }));
}

// ==================== UPDATE ====================

export async function updateTemplate(
  templateId: string,
  updates: Partial<Omit<Template, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const updateData: any = {};
  
  if (updates.name) updateData.name = updates.name;
  if (updates.category) updateData.category = updates.category;
  if (updates.status) updateData.status = updates.status;
  if (updates.styleConfig) updateData.style_config = updates.styleConfig;
  if (updates.tags) updateData.tags = updates.tags;
  if (updates.favorite !== undefined) updateData.favorite = updates.favorite;
  if (updates.profileId !== undefined) updateData.profile_id = updates.profileId || null;

  const { error } = await supabase
    .from('templates')
    .update(updateData)
    .eq('id', templateId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

export async function toggleTemplateFavorite(templateId: string, favorite: boolean): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('templates')
    .update({ favorite })
    .eq('id', templateId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

// ==================== DELETE ====================

export async function deleteTemplate(templateId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', templateId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

// ==================== PERFORMANCE ====================

export async function getTemplatePerformance(templateId: string): Promise<TemplatePerformance | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // First verify user owns the template
  const { data: template } = await supabase
    .from('templates')
    .select('id')
    .eq('id', templateId)
    .eq('user_id', user.id)
    .single();

  if (!template) return null;

  const { data, error } = await supabase
    .from('template_performance')
    .select('*')
    .eq('template_id', templateId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No performance data yet
      return {
        totalPosts: 0,
        avgEngagementRate: 0,
        avgSaves: 0,
        avgShares: 0,
        avgImpressions: 0,
        lastUpdated: null,
      };
    }
    throw new Error(error.message);
  }

  return {
    totalPosts: data.total_posts,
    avgEngagementRate: Number(data.avg_engagement_rate),
    avgSaves: data.avg_saves,
    avgShares: data.avg_shares,
    avgImpressions: data.avg_impressions,
    lastUpdated: data.last_updated ? new Date(data.last_updated) : null,
  };
}
