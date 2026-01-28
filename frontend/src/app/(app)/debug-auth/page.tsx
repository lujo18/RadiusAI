"use client";

import React from "react";
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store';
import { useRouter } from 'next/navigation';

export default function DebugAuthPage() {
  const router = useRouter();
  const authStore = useAuthStore();
  const [supabaseAuth, setSupabaseAuth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();
      
      setSupabaseAuth({ session, user });
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  const handleClearAuth = async () => {
    await supabase.auth.signOut();
    authStore.logout();
    localStorage.clear();
    alert('Auth cleared! Refreshing...');
    window.location.href = '/';
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-dark-600 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Auth Debug</h1>
      
      <div className="space-y-8">
        {/* Zustand Store */}
        <div className="bg-dark-500 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Zustand Auth Store</h2>
          <pre className="bg-dark-400 p-4 rounded overflow-auto text-sm">
            {JSON.stringify({
              isAuthenticated: authStore.isAuthenticated,
              isLoading: authStore.isLoading,
              user: authStore.user,
              hasSession: !!authStore.session,
              sessionExpiry: authStore.session?.expires_at,
            }, null, 2)}
          </pre>
        </div>

        {/* Supabase Auth */}
        <div className="bg-dark-500 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Supabase Auth</h2>
          <pre className="bg-dark-400 p-4 rounded overflow-auto text-sm">
            {JSON.stringify({
              hasSession: !!supabaseAuth?.session,
              sessionExpiry: supabaseAuth?.session?.expires_at,
              hasUser: !!supabaseAuth?.user,
              userId: supabaseAuth?.user?.id,
              userEmail: supabaseAuth?.user?.email,
            }, null, 2)}
          </pre>
        </div>

        {/* localStorage */}
        <div className="bg-dark-500 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">localStorage</h2>
          <pre className="bg-dark-400 p-4 rounded overflow-auto text-sm">
            {JSON.stringify({
              authStorage: localStorage.getItem('auth-storage'),
              supabaseKeys: Object.keys(localStorage).filter(k => k.includes('supabase')),
            }, null, 2)}
          </pre>
        </div>

        {/* Actions */}
        <div className="space-x-4">
          <Button
            onClick={handleClearAuth}
            className="bg-red-500 hover:bg-red-600 px-6 py-3 rounded-lg font-semibold"
          >
            Clear All Auth & Reload
          </Button>
          <Button
            onClick={() => router.push('/pricing')}
            className="bg-primary-500 hover:bg-primary-600 px-6 py-3 rounded-lg font-semibold"
          >
            Go to Pricing
          </Button>
          <Button
            onClick={() => router.push('/signup?plan=growth')}
            className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg font-semibold"
          >
            Go to Signup
          </Button>
        </div>
      </div>
    </div>
  );
}