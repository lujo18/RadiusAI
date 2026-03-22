'use client'

import { useEffect, use, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTeam } from '@/lib/api/hooks/useTeams'
import { useAuth } from '@/lib/api/hooks/useAuth'
import { teamStore } from '@/lib/zustand/stores/teamStore'
import { Spinner } from '@/components/ui/spinner'
import { surfaceAPI } from '@/lib/api/client'

/**
 * Team Context Layout
 * 
 * This layout wraps all team-scoped routes ([teamId]/(routes))
 * It handles:
 * - Extracting teamId from URL params
 * - Validating user has access to team (for authenticated users)
 * - Allowing public teams to be accessed without authentication
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
  const [publicTeam, setPublicTeam] = useState<any>(null)
  const [publicTeamLoading, setPublicTeamLoading] = useState(!user)
  const [publicTeamError, setPublicTeamError] = useState<any>(null)
  const setCurrentTeam = teamStore((state) => state.setCurrentTeam)

  // If user is not authenticated, try to load the team as public
  useEffect(() => {
    if (!user && !userLoading && !publicTeam && publicTeamLoading) {
      const fetchPublicTeam = async () => {
        setPublicTeamLoading(true)
        try {
          const result = await surfaceAPI.teams.getPublicTeam(resolvedParams.teamId)
          if (result.data) {
            setPublicTeam(result.data)
            setPublicTeamError(null)
          } else {
            setPublicTeamError(result.error || new Error('Team not found'))
            setPublicTeam(null)
          }
        } catch (err) {
          setPublicTeamError(err)
          setPublicTeam(null)
        } finally {
          setPublicTeamLoading(false)
        }
      }
      fetchPublicTeam()
    }
  }, [user, userLoading, resolvedParams.teamId, publicTeam, publicTeamLoading])

  // Handle team changes - update Zustand store
  useEffect(() => {
    const activeTeam = team || publicTeam
    if (activeTeam) {
      setCurrentTeam(activeTeam)
    }
  }, [team, publicTeam, setCurrentTeam])

  // Handle access denied - redirect to first available team
  useEffect(() => {
    if (teamError && !teamLoading && !publicTeam) {
      // User doesn't have access to this team and it's not public
      // This will be caught by RLS policies
      console.error('Team access denied:', teamError.message)
      
      // Could redirect to /teams to show a team selector
      // Or to their default team
      // For now, show error
    }
  }, [teamError, teamLoading, publicTeam])

  // Loading states
  if ((userLoading || teamLoading) && !publicTeam) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Spinner className="size-8" />
      </div>
    )
  }

  // If public team loaded, allow access
  if (publicTeam) {
    return <>{children}</>
  }

  // Error states
  if (!user && !publicTeam && !publicTeamLoading) {
    // No authenticated user and no public team found
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-red-400 mb-2">Team Not Found</h1>
          <p className="text-foreground/60 mb-4">
            This team is not publicly available. Please log in to access it.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-primary text-background rounded-lg hover:bg-primary/80 mr-2"
          >
            Log In
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  if (!user && !publicTeam) {
    // User not authenticated at all
    router.push('/login')
    return null
  }

  if (teamError && !team && !publicTeam) {
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
