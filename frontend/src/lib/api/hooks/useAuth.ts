/**
 * Auth Hook - Get currently authenticated user
 * 
 * Returns user and loading state from Supabase auth
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
}

/**
 * useAuth - Hook to get current authentication state
 * 
 * Should be called on every page that requires authentication.
 * It will automatically redirect to login if not authenticated.
 */
export function useAuth(options?: { requireAuth?: boolean }) {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  })

  const router = useRouter()

  useEffect(() => {
    // Check current session
    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) throw error

        if (session?.user) {
          setAuth({
            user: session.user,
            session,
            isLoading: false,
            isAuthenticated: true,
          })
        } else {
          setAuth({
            user: null,
            session: null,
            isLoading: false,
            isAuthenticated: false,
          })

          // Redirect to login if auth is required
          if (options?.requireAuth !== false) {
            router.push('/auth/login')
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setAuth({
          user: null,
          session: null,
          isLoading: false,
          isAuthenticated: false,
        })

        if (options?.requireAuth !== false) {
          router.push('/auth/login')
        }
      }
    }

    checkAuth()

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuth({
          user: session.user,
          session,
          isLoading: false,
          isAuthenticated: true,
        })
      } else {
        setAuth({
          user: null,
          session: null,
          isLoading: false,
          isAuthenticated: false,
        })
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [router, options?.requireAuth])

  return auth
}
