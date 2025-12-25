'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store';
import { supabase } from '@/lib/supabase/client';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((state) => state.setUser);
  const setSupabaseUser = useAuthStore((state) => state.setSupabaseUser);
  const setSession = useAuthStore((state) => state.setSession);
  const logout = useAuthStore((state) => state.logout);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    console.log('[AuthProvider] Initializing...');
    setLoading(true);
    
    // Check active session
    const checkSession = async () => {
      console.log('[AuthProvider] Checking session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      console.log('[AuthProvider] Session check result:', {
        hasSession: !!session,
        userId: session?.user?.id,
        error: error?.message
      });
      
      if (session?.user) {
        const user = {
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          plan: 'growth' as const, // Default, will be synced from database
        };
        
        console.log('[AuthProvider] Setting authenticated user:', user.id);
        setUser(user);
        setSupabaseUser(session.user);
        setSession(session);
      } else {
        console.log('[AuthProvider] No session found, logging out');
        logout();
      }
      
      setLoading(false);
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthProvider] Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN' && session?.user) {
        const user = {
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          plan: null, // Will be fetched from database/set by webhook
        };
        
        console.log('[AuthProvider] User signed in:', user.id);
        setUser(user);
        setSupabaseUser(session.user);
        setSession(session);
      } else if (event === 'SIGNED_OUT') {
        console.log('[AuthProvider] User signed out');
        logout();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setSupabaseUser, setSession, logout, setLoading]);

  return <>{children}</>;
}
