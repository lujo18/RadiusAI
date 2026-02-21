'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Team Root Redirect Page
 * 
 * Redirects /:teamId/ to /:teamId/overview
 */
export default function TeamRootPage() {
  const router = useRouter()
  const params = useParams()
  const teamId = params.teamId as string

  useEffect(() => {
    if (teamId) {
      router.push(`/${teamId}/overview`)
    }
  }, [teamId, router])

  return null
}
