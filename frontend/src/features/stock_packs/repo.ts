import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

export type StockPackRow = Database['public']['Tables']['stock_packs']['Row'];

const TABLE = 'stock_packs';

export class StockPacksRepo {
  table = TABLE;

  async list(): Promise<StockPackRow[]> {
    let q = supabase.from(TABLE).select('*');
    const { data, error } = await q;
    if (error) {
      const errorMsg = error.message || JSON.stringify(error);
      console.error('[StockPackRepo.list]', errorMsg, error);
      throw new Error(`Failed to list Stock Packs: ${errorMsg}`);
    }

    console.log("STOCK PACKS", data)
    return data as StockPackRow[];
  }
}

export const stockPacksRepo = new StockPacksRepo();
export default stockPacksRepo;
