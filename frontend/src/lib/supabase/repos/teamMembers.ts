import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type TeamMemberRow = Database['public']['Tables']['team_members']['Row'];
type TeamMemberInsert = Database['public']['Tables']['team_members']['Insert'];
type TeamMemberUpdate = Database['public']['Tables']['team_members']['Update'];

const TABLE = 'team_members';

export class TeamMembersRepo {
  table = TABLE;

  async list(teamId?: string): Promise<TeamMemberRow[]> {
    let q = supabase.from(this.table).select('*');
    if (teamId) q = q.eq('team_id', teamId);
    const { data, error } = await q;
    if (error) throw error;
    return data as TeamMemberRow[];
  }

  async getById(id: string): Promise<TeamMemberRow | null> {
    const { data, error } = await supabase.from(this.table).select('*').eq('id', id).single();
    if (error) {
      // @ts-ignore
      if (error?.code === 'PGRST116') return null;
      throw error;
    }
    return data as TeamMemberRow;
  }

  async create(payload: TeamMemberInsert): Promise<TeamMemberRow> {
    const { data, error } = await supabase.from(this.table).insert(payload).select().single();
    if (error) throw error;
    return data as TeamMemberRow;
  }

  async update(id: string, updates: TeamMemberUpdate): Promise<TeamMemberRow> {
    const { data, error } = await supabase.from(this.table).update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as TeamMemberRow;
  }

  async remove(id: string): Promise<boolean> {
    const { error } = await supabase.from(this.table).delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}

export const teamMembersRepo = new TeamMembersRepo();
export default teamMembersRepo;
