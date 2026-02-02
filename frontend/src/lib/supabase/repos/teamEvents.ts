import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type TeamEventRow = Database['public']['Tables']['team_events']['Row'];
type TeamEventInsert = Database['public']['Tables']['team_events']['Insert'];
type TeamEventUpdate = Database['public']['Tables']['team_events']['Update'];

const TABLE = 'team_events';

export class TeamEventsRepo {
  table = TABLE;

  async list(teamId?: string): Promise<TeamEventRow[]> {
    let q = supabase.from('team_events').select('*');
    if (teamId) q = q.eq('team_id', teamId);
    const { data, error } = await q;
    if (error) throw error;
    return data as TeamEventRow[];
  }

  async getById(id: string): Promise<TeamEventRow | null> {
    const { data, error } = await supabase.from('team_events').select('*').eq('id', id).single();
    if (error) {
      // @ts-ignore
      if (error?.code === 'PGRST116') return null;
      throw error;
    }
    return data as TeamEventRow;
  }

  async create(payload: TeamEventInsert): Promise<TeamEventRow> {
    const { data, error } = await supabase.from('team_events').insert(payload).select().single();
    if (error) throw error;
    return data as TeamEventRow;
  }

  async update(id: string, updates: TeamEventUpdate): Promise<TeamEventRow> {
    const { data, error } = await supabase.from('team_events').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as TeamEventRow;
  }

  async remove(id: string): Promise<boolean> {
    const { error } = await supabase.from('team_events').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}

export const teamEventsRepo = new TeamEventsRepo();
export default teamEventsRepo;
