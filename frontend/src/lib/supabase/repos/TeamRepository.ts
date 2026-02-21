import { supabase } from '../client';

export class TeamRepository {
  /**
   * Get all teams for the current user (via team_members table)
   * Returns team_id and related team info
   */
  static async getUserTeams() {
    const { data, error } = await supabase
      .from('team_members')
      .select('team_id, teams(id, name, slug, owner_id)')
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Get first (primary) team for current user
   * Used for dashboard redirects
   */
  static async getFirstTeam() {
    const { data, error } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('status', 'active')
      .order('created_at', { ascending: true })
      .limit(1);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return null;
    return data[0].team_id;
  }

  /**
   * Get team details by ID
   */
  static async getTeam(teamId: string) {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data;
  }

  /**
   * Create a new team
   */
  static async createTeam(team: { name: string; slug: string; owner_id: string; description?: string }) {
    const { data, error } = await supabase
      .from('teams')
      .insert([team] as any)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Update team
   */
  static async updateTeam(teamId: string, updates: any) {
    const { data, error } = await supabase
      .from('teams')
      .update(updates)
      .eq('id', teamId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Delete team (soft delete)
   */
  static async deleteTeam(teamId: string) {
    const { error } = await supabase
      .from('teams')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', teamId);

    if (error) throw new Error(error.message);
  }
}
