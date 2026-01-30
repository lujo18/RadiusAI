import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type TeamRow = Database['public']['Tables']['teams']['Row'];
type TeamInsert = Database['public']['Tables']['teams']['Insert'];
type TeamUpdate = Database['public']['Tables']['teams']['Update'];

const TABLE = 'teams';

export class TeamsRepo {
  table = TABLE;

  async list(): Promise<TeamRow[]> {
    const { data, error } = await supabase.from(this.table).select('*');
    if (error) throw error;
    return data as TeamRow[];
  }

  async getById(id: string): Promise<TeamRow | null> {
    const { data, error } = await supabase.from(this.table).select('*').eq('id', id).single();
    if (error) {
      // @ts-ignore
      if (error?.code === 'PGRST116') return null;
      throw error;
    }
    return data as TeamRow;
  }

  async create(payload: TeamInsert): Promise<TeamRow> {
    const { data, error } = await supabase.from(this.table).insert(payload).select().single();
    if (error) throw error;
    return data as TeamRow;
  }

  async update(id: string, updates: TeamUpdate): Promise<TeamRow> {
    const { data, error } = await supabase.from(this.table).update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as TeamRow;
  }

  async remove(id: string): Promise<boolean> {
    const { error } = await supabase.from(this.table).delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}

export const teamsRepo = new TeamsRepo();
export default teamsRepo;
