'use client'

import { useEffect, use } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTeam } from '@/lib/api/hooks/useTeams'
import { useAuth } from '@/lib/api/hooks/useAuth'
import { teamStore } from '@/lib/zustand/stores/teamStore'
import { Spinner } from '@/components/ui/spinner'

/**
 * Team Context Layout
 * 
 * This layout wraps all team-scoped routes ([teamId]/(routes))
 * It handles:
 * - Extracting teamId from URL params
 * - Validating user has access to team
 * - Setting up team context in Zustand store
 * - Handling team context errors gracefully
 */
export default function TeamLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ teamId: string }>
}) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { user, isLoading: userLoading } = useAuth()
  const { data: team, isLoading: teamLoading, error: teamError } = useTeam(resolvedParams.teamId)
  const setCurrentTeam = teamStore((state) => state.setCurrentTeam)

  // Handle team changes - update Zustand store
  useEffect(() => {
    setCurrentTeam(team ?? null)
  }, [team, setCurrentTeam])

  // Handle access denied - redirect to first available team
  useEffect(() => {
    if (teamError && !teamLoading) {
      // User doesn't have access to this team
      // This will be caught by RLS policies
      console.error('Team access denied:', teamError.message)
      
      // Could redirect to /teams to show a team selector
      // Or to their default team
      // For now, show error
    }
  }, [teamError, teamLoading])

  // Loading states
  if (userLoading || teamLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Spinner className="size-8" />
      </div>
    )
  }

  // Error states
  if (!user) {
    // User not authenticated - auth middleware should have caught this
    router.push('/auth/login')
    return null
  }

  if (teamError || !team) {
    // Team not found or access denied
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-red-400 mb-2">Team Not Found</h1>
          <p className="text-foreground/60 mb-4">
            You don't have access to this team or it doesn't exist.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-primary text-background rounded-lg hover:bg-primary/80"
          >
            Back to Teams
          </button>
        </div>
      </div>
    )
  }

  // Success - render team-scoped content with team context available
  return <>{children}</>
}
