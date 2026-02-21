"use client";
import React from "react";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiUser } from 'react-icons/fi';
import { FaGoogle } from 'react-icons/fa';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { signInWithGoogle } from '@/lib/supabase/auth';
import type { User } from '@supabase/supabase-js';

export default function PublicNavbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

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

  const handleGetStarted = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[Navbar] Get Started clicked - initiating Google signin');
    setIsSigningIn(true);
    try {
      console.log('[Navbar] Calling signInWithGoogle...');
      await signInWithGoogle();
      console.log('[Navbar] Google signin initiated');
    } catch (error) {
      console.error('[Navbar] Google signin error:', error);
      setIsSigningIn(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Image src="/images/icon-primary.png" alt="Radius Logo" width={48} height={48} />
          <span className="text-2xl font-display font-bold text-foreground">Radius</span>
        </Link>

        <div className="hidden md:flex items-center space-x-8">
          <a href="/#benefits" className="text-muted-foreground hover:text-foreground transition">Features</a>
          <Link 
            href="/pricing" 
            className={`transition ${pathname === '/pricing' ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Pricing
          </Link>
          <a href="/#faq" className="text-muted-foreground hover:text-foreground transition">FAQ</a>
          
          {!loading && (
            <>
              {user ? (
                <>
                  <Link href="/overview" className="btn-primary">
                    Go to Dashboard
                  </Link>
                  <Link href="/overview" className="flex items-center space-x-2 text-foreground/80 hover:text-foreground transition">
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt={userName}
                        className="w-8 h-8 rounded-full border-2 border-accent"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center">
                        <FiUser className="text-accent" />
                      </div>
                    )}
                    <span className="text-sm">{userName}</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-foreground/80 hover:text-foreground transition">Login</Link>
                  <Button 
                    type="button"
                    onClick={handleGetStarted}
                    disabled={isSigningIn}
                    className="btn-primary"
                  >
                    {isSigningIn ? (
                      <span>Signing in...</span>
                    ) : (
                      <>
                        <FaGoogle className="mr-2" />
                        Get Started
                      </>
                    )}
                  </Button>
                </>
              )}
            </>
          )}
        </div>

        {/* Mobile Menu (simplified for now) */}
        <div className="md:hidden">
          {!loading && user ? (
            <Link href="/overview">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={userName}
                  className="w-8 h-8 rounded-full border-2 border-accent"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center">
                  <FiUser className="text-accent" />
                </div>
              )}
            </Link>
          ) : (
            <Button 
              type="button"
              onClick={handleGetStarted}
              disabled={isSigningIn}
              className="btn-primary text-sm px-4 py-2"
            >
              {isSigningIn ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <FaGoogle className="mr-2" />
                  Get Started
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
