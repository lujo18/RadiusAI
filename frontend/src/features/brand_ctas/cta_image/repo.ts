import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type BrandCtaRow = Database['public']['Tables']['brand_ctas']['Row'];
type BrandCtaInsert = Database['public']['Tables']['brand_ctas']['Insert'];
type BrandCtaUpdate = Database['public']['Tables']['brand_ctas']['Update'];

const TABLE = 'cta_images';

export class BrandCtaImageRepo {
  myBucket = supabase.storage.from('my-bucket-name');

  table = TABLE;

  async list(brandId?: string): Promise<BrandCtaRow[]> {
    let q = supabase.from('brand_ctas').select('*');
    if (brandId) q = q.eq('brand_id', brandId);
    const { data, error } = await q;
    if (error) {
      const errorMsg = error.message || JSON.stringify(error);
      console.error('[BrandCtasRepo.list]', errorMsg, error);
      throw new Error(`Failed to list CTAs: ${errorMsg}`);
    }
    return data as BrandCtaRow[];
  }

  async getById(id: string): Promise<BrandCtaRow | null> {
    const { data, error } = await supabase.from('brand_ctas').select('*').eq('id', id).single();
    if (error) {
      // PGRST116: row not found
      // Supabase client error codes are strings; handle missing row gracefully
      // Return null for not found
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (error?.code === 'PGRST116') return null;
      throw error;
    }
    return data as BrandCtaRow;
  }

  async create(payload: BrandCtaInsert): Promise<BrandCtaRow> {
    const { data, error } = await supabase
      .from('brand_ctas')
      .insert(payload)
      .select('*');
    
    if (error) {
      const errorMsg = error.message || error.details || JSON.stringify(error);
      console.error('[BrandCtasRepo.create]', errorMsg, error);
      throw new Error(`Failed to create CTA: ${errorMsg}`);
    }
    
    if (!data || data.length === 0) {
      throw new Error('Failed to create CTA: no data returned');
    }
    
    return data[0] as BrandCtaRow;
  }

  async update(id: string, updates: BrandCtaUpdate): Promise<BrandCtaRow> {
    const { data, error } = await supabase
      .from('brand_ctas')
      .update(updates)
      .eq('id', id)
      .select('*');
    
    if (error) {
      const errorMsg = error.message || error.details || JSON.stringify(error);
      console.error(`[BrandCtasRepo.update] ${id}:`, errorMsg, error);
      throw new Error(`Failed to update CTA: ${errorMsg}`);
    }
    
    // Handle array response
    if (!data || data.length === 0) {
      throw new Error(`CTA with id ${id} not found`);
    }
    
    return data[0] as BrandCtaRow;
  }

  async remove(id: string): Promise<boolean> {
    const { error } = await supabase.from('brand_ctas').delete().eq('id', id);
    if (error) {
      const errorMsg = error.message || JSON.stringify(error);
      console.error(`[BrandCtasRepo.remove] ${id}:`, errorMsg, error);
      throw new Error(`Failed to delete CTA: ${errorMsg}`);
    }
    return true;
  }
}

export const brandCtasRepo = new BrandCtaImageRepo();
export default brandCtasRepo;
