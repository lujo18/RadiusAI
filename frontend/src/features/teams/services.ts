import { supabase } from "@/lib/supabase/client";
import { TeamsRepository } from "./repo";

export const teamsApi = {
  async getTeam(teamId: string) {
      return await TeamsRepository.getTeam(teamId);
    },
  
    async getTeamByOwnerId(userId: string) {
      return await TeamsRepository.getTeamByOwnerId(userId);
    },
  
    async getTeamByMemberId(userId: string) {
      return await TeamsRepository.getTeamByMemberId(userId);
    },

    async getPublicTeam(teamId: string) {
      return await TeamsRepository.getPublicTeam(teamId);
    },
  
    async listUserTeams() {
      console.log('[teamsApi] listUserTeams called');
      try {
        // Get user's teams they're a member of
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          console.error('[teamsApi] Auth error:', authError);
          return { data: [] }
        }
  
        if (!user) {
          console.debug('[teamsApi] No authenticated user');
          return { data: [] }
        }
  
        console.log('[teamsApi] Fetching teams for user:', user.id)
  
        // Query 1: Teams where user is the owner
        const ownedTeams = await this.getTeamByOwnerId(user.id);
  
        // Query 2: Teams where user is a member
        const memberTeams = await this.getTeamByMemberId(user.id);
  
        // Get the team details for member teams
        let memberTeamDetails: any[] = []
        if (memberTeams && memberTeams.length > 0) {
          const teamIds = memberTeams.map(m => m.team_id)
          console.debug('[teamsApi] Fetching details for member team IDs:', teamIds)
          
          const { data: teams, error: teamsError } = await supabase
            .from('teams')
            .select('*')
            .in('id', teamIds)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
  
          if (teamsError) {
            console.warn('[teamsApi] Error fetching member team details:', teamsError);
          } else {
            memberTeamDetails = teams || []
            console.debug('[teamsApi] Fetched details for', memberTeamDetails.length, 'member teams');
          }
        }
  
        // Combine and deduplicate teams
        const teamMap = new Map()
        ;(ownedTeams || []).forEach(t => teamMap.set(t.id, t))
        memberTeamDetails.forEach(t => teamMap.set(t.id, t))
        
        const allTeams = Array.from(teamMap.values())
        console.log('[teamsApi] Returning', allTeams.length, 'total teams for user', user.id)
        
        return { data: allTeams }
      } catch (err) {
        console.error('[teamsApi] Exception in listUserTeams:', err)
        return { data: [], error: err }
      }
    },
}