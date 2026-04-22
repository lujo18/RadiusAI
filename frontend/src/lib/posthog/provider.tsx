'use client'

import { useEffect, useState } from "react"
import type { PostHog } from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<PostHog | null>(null)

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
    const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST

    if (!token || !apiHost) return

    let isMounted = true

    const initPosthog = async () => {
      const { default: posthog } = await import('posthog-js')

      posthog.init(token, {
        api_host: apiHost,
        defaults: '2026-01-30',
      })

      if (isMounted) {
        setClient(posthog)
      }
    }

    void initPosthog()

    return () => {
      isMounted = false
    }
  }, [])

  if (!client) {
    return <>{children}</>
  }

  return (
    <PHProvider client={client}>
      {children}
    </PHProvider>
  )
}