/**
 * Team Hooks - TanStack Query hooks for team operations
 * 
 * These hooks provide access to team data and operations with automatic
 * caching, refetching, and error handling.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { surfaceAPI } from '@/lib/api/client'
import { Team, TeamDetail, TeamMember } from '@/types/team'
import { teamsSurface } from '@/features/teams/surface'

const TEAMS_QUERY_KEYS = {
  all: ['teams'] as const,
  list: () => [...TEAMS_QUERY_KEYS.all, 'list'] as const,
  detail: (id: string) => [...TEAMS_QUERY_KEYS.all, 'detail', id] as const,
}

/**
 * useUserTeams - Fetch all teams the current user belongs to
 * 
 * Used to populate team selector, check if user has teams, etc.
 */
export function useUserTeams() {
  return useQuery<Team[]>({
    queryKey: TEAMS_QUERY_KEYS.list(),
    queryFn: async () => {
      const response = await teamsSurface.listUserTeams()
      return response.data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  })
}

/**
 * useTeam - Fetch a specific team with members (if user has access)
 * 
 * Used in [teamId]/layout.tsx to validate access and populate team context
 */
export function useTeam(teamId?: string) {
  return useQuery<TeamDetail>({
    queryKey: TEAMS_QUERY_KEYS.detail(teamId || ''),
    queryFn: async (): Promise<TeamDetail> => {
      if (!teamId) throw new Error('Team ID required')
      const response = await teamsSurface.getTeam(teamId)
      if (!response.data) throw new Error('Team not found')
      return response.data
    },
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * useTeamFromParams - Extract teamId from URL params and fetch team
 * 
 * Convenience hook for use in team-scoped routes
 */
export function useTeamFromParams() {
  const params = useParams()
  const teamId = params.teamId as string
  return useTeam(teamId)
}

/**
 * useCreateTeam - Create a new team
 */
export function useCreateTeam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { name: string; slug: string; description?: string }) => {
      const response = await surfaceAPI.teams.createTeam(data)
      return response.data
    },
    onSuccess: (newTeam) => {
      // Invalidate team list to refetch
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEYS.list() })
      // Optionally add the new team to the list immediately
      queryClient.setQueryData(
        TEAMS_QUERY_KEYS.detail(newTeam.id),
        newTeam
      )
    },
  })
}

/**
 * useUpdateTeam - Update team details
 */
export function useUpdateTeam(teamId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { name?: string; slug?: string; description?: string; avatar_url?: string }) => {
      const response = await surfaceAPI.teams.updateTeam(teamId, data)
      return response.data
    },
    onSuccess: (updatedTeam) => {
      queryClient.setQueryData(
        TEAMS_QUERY_KEYS.detail(teamId),
        updatedTeam
      )
    },
  })
}

/**
 * useDeleteTeam - Soft-delete a team
 */
export function useDeleteTeam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (teamId: string) => {
      const response = await surfaceAPI.teams.deleteTeam(teamId)
      return response.data
    },
    onSuccess: (_, teamId) => {
      // Invalidate team lists to refetch
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEYS.list() })
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEYS.detail(teamId) })
    },
  })
}

/**
 * useInviteTeamMember - Invite an external user to a team
 */
export function useInviteTeamMember(teamId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { email: string; role?: 'admin' | 'member' | 'viewer' }) => {
      const response = await surfaceAPI.teams.inviteTeamMember(teamId, data)
      return response.data
    },
    onSuccess: (newMember) => {
      // Invalidate team detail to refetch members list
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEYS.detail(teamId) })
    },
  })
}

/**
 * useUpdateTeamMemberRole - Update a team member's role
 */
export function useUpdateTeamMemberRole(teamId: string, memberId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { role: 'admin' | 'member' | 'viewer' }) => {
      const response = await surfaceAPI.teams.updateTeamMemberRole(teamId, memberId, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEYS.detail(teamId) })
    },
  })
}

/**
 * useRemoveTeamMember - Remove a team member
 */
export function useRemoveTeamMember(teamId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (memberId: string) => {
      const response = await surfaceAPI.teams.removeTeamMember(teamId, memberId)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEYS.detail(teamId) })
    },
  })
}

/**
 * useTeamEvents - Fetch audit log for a team
 */
export function useTeamEvents(teamId?: string, limit: number = 50) {
  return useQuery({
    queryKey: [...TEAMS_QUERY_KEYS.detail(teamId || ''), 'events', limit],
    queryFn: async () => {
      if (!teamId) throw new Error('Team ID required')
      const response = await surfaceAPI.teams.getTeamEvents(teamId, limit)
      return response.data || []
    },
    enabled: !!teamId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}
