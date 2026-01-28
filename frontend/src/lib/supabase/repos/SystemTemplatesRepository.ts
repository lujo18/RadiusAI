import { supabase } from '../client';
import type { Database } from '@/types/database';

type SystemTemplate = Database['public']['Tables']['system_templates']['Row'];
type SystemTemplateInsert = Database['public']['Tables']['system_templates']['Insert'];
type SystemTemplateUpdate = Database['public']['Tables']['system_templates']['Update'];

export class SystemTemplatesRepository {
  static async getSystemTemplates(): Promise<SystemTemplate[]> {
    const { data, error } = await supabase
      .from('system_templates')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  static async getSystemTemplate(id: string): Promise<SystemTemplate | null> {
    const { data, error } = await supabase
      .from('system_templates')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data;
  }

  static async createSystemTemplate(template: SystemTemplateInsert): Promise<SystemTemplate> {
    const { data, error } = await supabase
      .from('system_templates')
      .insert([template])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  static async updateSystemTemplate(id: string, updates: SystemTemplateUpdate): Promise<SystemTemplate> {
    const { data, error } = await supabase
      .from('system_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  static async deleteSystemTemplate(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('system_templates')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }
}
