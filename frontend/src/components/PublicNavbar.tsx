import React from "react";
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiUser } from 'react-icons/fi';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function PublicNavbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Get user avatar URL from Supabase auth metadata
  const getAvatarUrl = () => {
    if (user?.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url;
    }
    if (user?.user_metadata?.picture) {
      return user.user_metadata.picture;
    }
    return null;
  };

  const avatarUrl = getAvatarUrl();
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-600/80 backdrop-blur-lg border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Image src="/images/icon-primary.png" alt="Radius Logo" width={48} height={48} />
          <span className="text-2xl font-display font-bold text-white">Radius</span>
        </Link>

        <div className="hidden md:flex items-center space-x-8">
          <a href="/#benefits" className="text-gray-300 hover:text-white transition">Features</a>
          <Link 
            href="/pricing" 
            className={`transition ${pathname === '/pricing' ? 'text-white font-semibold' : 'text-gray-300 hover:text-white'}`}
          >
            Pricing
          </Link>
          <a href="/#faq" className="text-gray-300 hover:text-white transition">FAQ</a>
          
          {!loading && (
            <>
              {user ? (
                <>
                  <Link href="/dashboard" className="btn-primary">
                    Go to Dashboard
                  </Link>
                  <Link href="/dashboard" className="flex items-center space-x-2 text-gray-300 hover:text-white transition">
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt={userName}
                        className="w-8 h-8 rounded-full border-2 border-primary-500"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary-500/20 border-2 border-primary-500 flex items-center justify-center">
                        <FiUser className="text-primary-500" />
                      </div>
                    )}
                    <span className="text-sm">{userName}</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-gray-300 hover:text-white transition">Login</Link>
                  <Link href="/signup" className="btn-primary">
                    Get Started
                  </Link>
                </>
              )}
            </>
          )}
        </div>

        {/* Mobile Menu (simplified for now) */}
        <div className="md:hidden">
          {!loading && user ? (
            <Link href="/dashboard">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={userName}
                  className="w-8 h-8 rounded-full border-2 border-primary-500"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-500/20 border-2 border-primary-500 flex items-center justify-center">
                  <FiUser className="text-primary-500" />
                </div>
              )}
            </Link>
          ) : (
            <Link href="/signup" className="btn-primary text-sm px-4 py-2">
              Get Started
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
