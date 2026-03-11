import { teamsApi } from "./services"
import type { Team, TeamDetail } from "@/types/team"

export const teamsSurface = {
  getTeam: async (teamId: string): Promise<{ data: TeamDetail | null }> => {
    console.log('[teamsSurface] getTeam', { teamId })
    const result = await teamsApi.getTeam(teamId)
    return result as { data: TeamDetail | null }
  },

  listUserTeams: async (): Promise<{ data: Team[] }> => {
    console.log('[teamsSurface] listUserTeams')
    const result = await teamsApi.listUserTeams()
    return result as { data: Team[] }
  },

  createTeam: async (data: { name: string; slug: string; description?: string }) => {
    console.log('[teamsSurface] createTeam', data)
    // TODO: implement
    return { data: null as any }
  },

  updateTeam: async (teamId: string, data: { name?: string; slug?: string; description?: string; avatar_url?: string }) => {
    console.log('[teamsSurface] updateTeam', { teamId, data })
    // TODO: implement
    return { data: null as any }
  },

  deleteTeam: async (teamId: string) => {
    console.log('[teamsSurface] deleteTeam', { teamId })
    // TODO: implement
    return { data: null as any }
  },

  inviteTeamMember: async (teamId: string, data: { email: string; role?: 'admin' | 'member' | 'viewer' }) => {
    console.log('[teamsSurface] inviteTeamMember', { teamId, data })
    // TODO: implement
    return { data: null as any }
  },

  updateTeamMemberRole: async (teamId: string, memberId: string, data: { role: 'admin' | 'member' | 'viewer' }) => {
    console.log('[teamsSurface] updateTeamMemberRole', { teamId, memberId, data })
    // TODO: implement
    return { data: null as any }
  },

  removeTeamMember: async (teamId: string, memberId: string) => {
    console.log('[teamsSurface] removeTeamMember', { teamId, memberId })
    // TODO: implement
    return { data: null as any }
  },

  getTeamEvents: async (teamId: string, limit: number = 50) => {
    console.log('[teamsSurface] getTeamEvents', { teamId, limit })
    // TODO: implement
    return { data: [] as any[] }
  },
}