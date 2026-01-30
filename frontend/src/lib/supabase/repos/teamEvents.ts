import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type TeamEventRow = Database['public']['Tables']['team_events']['Row'];
type TeamEventInsert = Database['public']['Tables']['team_events']['Insert'];
type TeamEventUpdate = Database['public']['Tables']['team_events']['Update'];

const TABLE = 'team_events';

export class TeamEventsRepo {
  table = TABLE;

  async list(teamId?: string): Promise<TeamEventRow[]> {
    let q = supabase.from(this.table).select('*');
    if (teamId) q = q.eq('team_id', teamId);
    const { data, error } = await q;
    if (error) throw error;
    return data as TeamEventRow[];
  }

  async getById(id: string): Promise<TeamEventRow | null> {
    const { data, error } = await supabase.from(this.table).select('*').eq('id', id).single();
    if (error) {
      // @ts-ignore
      if (error?.code === 'PGRST116') return null;
      throw error;
    }
    return data as TeamEventRow;
  }

  async create(payload: TeamEventInsert): Promise<TeamEventRow> {
    const { data, error } = await supabase.from(this.table).insert(payload).select().single();
    if (error) throw error;
    return data as TeamEventRow;
  }

  async update(id: string, updates: TeamEventUpdate): Promise<TeamEventRow> {
    const { data, error } = await supabase.from(this.table).update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as TeamEventRow;
  }

  async remove(id: string): Promise<boolean> {
    const { error } = await supabase.from(this.table).delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}

export const teamEventsRepo = new TeamEventsRepo();
export default teamEventsRepo;
