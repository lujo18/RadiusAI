import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface User {
  id: string;
  name: string;
  email: string;
  plan: 'starter' | 'growth' | 'unlimited' | null;
}

interface AuthState {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User) => void;
  setSupabaseUser: (supabaseUser: SupabaseUser | null) => void;
  setSession: (session: Session | null) => void;
  login: (user: User, supabaseUser: SupabaseUser, session: Session) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      supabaseUser: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: true }),
      
      setSupabaseUser: (supabaseUser) => set({ supabaseUser }),
      
      setSession: (session) => set({ session }),
      
      login: (user, supabaseUser, session) => set({ 
        user, 
        supabaseUser,
        session,
        isAuthenticated: true 
      }),
      
      logout: () => set({ 
        user: null, 
        supabaseUser: null,
        session: null,
        isAuthenticated: false 
      }),
      
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
