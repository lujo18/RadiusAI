"use client";
import React from "react";
import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store';
import { supabase } from '@/lib/supabase/client';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((state) => state.setUser);
  const setSupabaseUser = useAuthStore((state) => state.setSupabaseUser);
  const setSession = useAuthStore((state) => state.setSession);
  const logout = useAuthStore((state) => state.logout);
  const setLoading = useAuthStore((state) => state.setLoading);
  // Track which userId was last applied to the store to suppress redundant updates
  const lastUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    console.log('[AuthProvider] Initializing...');
    
    const applySession = (sessionUser: any, session: any) => {
      // Only update store when user actually changes
      if (sessionUser?.id === lastUserIdRef.current) return;
      lastUserIdRef.current = sessionUser?.id ?? null;

      if (sessionUser) {
        const user = {
          id: sessionUser.id,
          name: sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'User',
          email: sessionUser.email || '',
          plan: 'growth' as const,
        };
        setUser(user);
        setSupabaseUser(sessionUser);
        setSession(session);
      } else {
        logout();
      }
    };

    // Check active session
    const checkSession = async () => {
      console.log('[AuthProvider] Checking session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      console.log('[AuthProvider] Session check result:', {
        hasSession: !!session,
        userId: session?.user?.id,
        error: error?.message
      });

      applySession(session?.user ?? null, session ?? null);
      setLoading(false);
    };

    checkSession();

    // Listen for auth changes — only update when user actually changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthProvider] Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN' && session?.user) {
        applySession(session.user, session);
      } else if (event === 'SIGNED_OUT') {
        applySession(null, null);
      }
      // TOKEN_REFRESHED and INITIAL_SESSION do not need store updates
      // (checkSession already handled the initial state; token refresh is transparent)
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setSupabaseUser, setSession, logout, setLoading]);

  return <>{children}</>;
}
