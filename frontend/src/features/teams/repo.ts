import { supabase } from "@/lib/supabase/client";

export class TeamsRepository {
  static async createTeam(name: string) {
    const { data, error } = await supabase
      .from("teams")
      // TODO: pass owner_id and slug when implementing createTeam
      .insert({ name } as any)
      .select("*")
      .single();
    if (error) {
      console.error("Error creating team:", error);
      throw error;
    }
    return data;
  }


  static async getTeam(teamId: string) {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*, team_members(*)')
        .eq('id', teamId)
        .is('deleted_at', null)
        .single()

      if (error) {
        console.error('Error fetching team:', error)
        return { data: null, error }
      }
      return { data }
    } catch (err) {
      console.error('Error in getTeam:', err)
      return { data: null, error: err }
    }
  }

  static async getTeamByOwnerId(userId: string) {
    const { data: ownedTeams, error: ownedError } = await supabase
      .from("teams")
      .select("*")
      .eq("owner_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (ownedError) {
      console.warn("[teamsApi] Error fetching owned teams:", ownedError);
    } else {
      console.debug(
        "[teamsApi] Found",
        (ownedTeams || []).length,
        "owned teams",
      );
    }

    return ownedTeams;
  }

  static async getTeamByMemberId(userId: string) {
    const { data: memberTeams, error: memberError } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", userId)
      .in("status", ["active", "pending"]);

    if (memberError) {
      console.warn("[teamsApi] Error fetching member teams:", memberError);
    } else {
      console.debug(
        "[teamsApi] Found",
        (memberTeams || []).length,
        "team memberships",
      );
    }

    return memberTeams;
  }


}


