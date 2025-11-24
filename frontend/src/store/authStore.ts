import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User as FirebaseUser } from 'firebase/auth';

interface User {
  id: string;
  name: string;
  email: string;
  plan: 'starter' | 'pro' | 'agency';
}

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User) => void;
  setFirebaseUser: (firebaseUser: FirebaseUser | null) => void;
  setToken: (token: string) => void;
  login: (user: User, token: string, firebaseUser?: FirebaseUser) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      firebaseUser: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: true }),
      
      setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
      
      setToken: (token) => set({ token }),
      
      login: (user, token, firebaseUser) => set({ 
        user, 
        token,
        firebaseUser: firebaseUser || null,
        isAuthenticated: true 
      }),
      
      logout: () => set({ 
        user: null, 
        token: null,
        firebaseUser: null,
        isAuthenticated: false 
      }),
      
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
