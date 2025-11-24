'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from '@/lib/firebase/auth';
import { useAuthStore } from '@/store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setFirebaseUser = useAuthStore((state) => state.setFirebaseUser);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        const token = await firebaseUser.getIdToken();
        
        const user = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || '',
          plan: 'starter' as const,
        };
        
        setFirebaseUser(firebaseUser);
        setUser(user);
        useAuthStore.getState().setToken(token);
      } else {
        // User is signed out
        logout();
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setFirebaseUser, setUser, logout, setLoading]);

  return <>{children}</>;
}
