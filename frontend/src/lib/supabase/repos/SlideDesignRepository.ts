import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { supabase } from '../client'

export class SlideDesignRepository {
  static async getSlideDesign(slideDesignId: string) {
    const { data, error } = await supabase
      .from('slide_designs')
      .select('*')
      .eq('id', slideDesignId)
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  static async getSlideDesignsByTemplate(templateId: string) {
    const { data, error } = await supabase
      .from('slide_designs')
      .select('*')
      .eq('template_id', templateId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  }

  static async createSlideDesign(design: Database['public']['Tables']['slide_designs']['Insert']) {
    const { data, error } = await supabase
      .from('slide_designs')
      .insert([design])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  static async updateSlideDesign(slideDesignId: string, updates: Partial<Database['public']['Tables']['slide_designs']['Update']>) {
    const { data, error } = await supabase
      .from('slide_designs')
      .update(updates)
      .eq('id', slideDesignId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  static async deleteSlideDesign(slideDesignId: string) {
    const { error } = await supabase
      .from('slide_designs')
      .delete()
      .eq('id', slideDesignId);
    if (error) throw new Error(error.message);
    return true;
  }
}
