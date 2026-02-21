/**
 * Team Store - Zustand store for team context management
 * 
 * Holds the current team context and provides simple state management
 * for team-related UI state (current team, etc.)
 */

import { create } from 'zustand'
import { Team } from '@/types/team'

interface TeamStore {
  // Current team context (set by [teamId]/layout.tsx)
  currentTeam: Team | null
  setCurrentTeam: (team: Team | null) => void

  // Clear when user logs out
  reset: () => void
}

export const teamStore = create<TeamStore>((set) => ({
  currentTeam: null,

  setCurrentTeam: (team) => {
    set({ currentTeam: team })
  },

  reset: () => {
    set({ currentTeam: null })
  },
}))

/**
 * Hook to get current team from store
 * Use this in components that need to know the current team context
 */
export function useCurrentTeam() {
  return teamStore((state) => state.currentTeam)
}

/**
 * Hook to set current team
 * Usually only called from [teamId]/layout.tsx
 */
export function useSetCurrentTeam() {
  return teamStore((state) => state.setCurrentTeam)
}
