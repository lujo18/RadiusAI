import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type BrandCtaRow = Database['public']['Tables']['brand_ctas']['Row'];
type BrandCtaInsert = Database['public']['Tables']['brand_ctas']['Insert'];
type BrandCtaUpdate = Database['public']['Tables']['brand_ctas']['Update'];

const TABLE = 'brand_ctas';

export class BrandCtasRepo {
  table = TABLE;

  async list(brandId?: string): Promise<BrandCtaRow[]> {
    let q = supabase.from(this.table).select('*');
    if (brandId) q = q.eq('brand_id', brandId);
    const { data, error } = await q;
    if (error) throw error;
    return data as BrandCtaRow[];
  }

  async getById(id: string): Promise<BrandCtaRow | null> {
    const { data, error } = await supabase.from(this.table).select('*').eq('id', id).single();
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
    const { data, error } = await supabase.from(this.table).insert(payload).select().single();
    if (error) throw error;
    return data as BrandCtaRow;
  }

  async update(id: string, updates: BrandCtaUpdate): Promise<BrandCtaRow> {
    const { data, error } = await supabase.from(this.table).update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as BrandCtaRow;
  }

  async remove(id: string): Promise<boolean> {
    const { error } = await supabase.from(this.table).delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}

export const brandCtasRepo = new BrandCtasRepo();
export default brandCtasRepo;
