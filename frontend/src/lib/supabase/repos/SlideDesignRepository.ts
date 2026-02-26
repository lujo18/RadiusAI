import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { supabase } from '../client'

// NOTE: The `slide_designs` table has been removed from the schema.
// This repository is kept as a reference but is no longer used.
// Using `any` cast to avoid type errors on the deleted table.
const db = supabase as any;

export class SlideDesignRepository {
  static async getSlideDesign(slideDesignId: string) {
    const { data, error } = await db
      .from('slide_designs')
      .select('*')
      .eq('id', slideDesignId)
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  static async getSlideDesignsByTemplate(templateId: string) {
    const { data, error } = await db
      .from('slide_designs')
      .select('*')
      .eq('template_id', templateId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  }

  static async createSlideDesign(design: any) {
    const { data, error } = await db
      .from('slide_designs')
      .insert([design])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  static async updateSlideDesign(slideDesignId: string, updates: any) {
    const { data, error } = await db
      .from('slide_designs')
      .update(updates)
      .eq('id', slideDesignId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  static async deleteSlideDesign(slideDesignId: string) {
    const { error } = await db
      .from('slide_designs')
      .delete()
      .eq('id', slideDesignId);
    if (error) throw new Error(error.message);
    return true;
  }
}
