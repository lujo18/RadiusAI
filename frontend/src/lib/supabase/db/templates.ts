/**
 * Supabase Database Operations - Templates
 * 
 * Handles all template-related database operations.
 * Returns raw Supabase types (snake_case) for direct use.
 */

import { supabase } from '../client';
import type { 
  Template, 
  TemplateInsert,
  TemplateUpdate,
  TemplatePerformance,
  Json
} from '@/types';

// ==================== CREATE ====================

export async function createTemplate(
  templateData: Omit<TemplateInsert, 'user_id'>
): Promise<Template> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('templates')
    .insert({
      ...templateData,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
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

  return data;
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

  return data;
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

  return data;
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

  return data;
}

// ==================== UPDATE ====================

export async function updateTemplate(
  templateId: string,
  updates: TemplateUpdate
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('templates')
    .update(updates)
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

export async function setDefaultTemplate(templateId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // First, unset any existing default
  await supabase
    .from('templates')
    .update({ is_default: false })
    .eq('user_id', user.id)
    .eq('is_default', true);

  // Then set the new default
  const { error } = await supabase
    .from('templates')
    .update({ is_default: true })
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
      // No performance data yet - return null
      return null;
    }
    throw new Error(error.message);
  }

  return data;
}
