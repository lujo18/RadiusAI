"use client";
import React from "react";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiUser, FiMenu, FiX } from 'react-icons/fi';
import { FaGoogle } from 'react-icons/fa';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { signInWithGoogle } from '@/lib/supabase/auth';
import type { User } from '@supabase/supabase-js';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';

export default function PublicNavbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { scrollY } = useScroll();
  
  // Transform values for the floating effect
  const navbarY = useTransform(scrollY, [0, 50], [0, 16]);
  const navbarPadding = useTransform(scrollY, [0, 50], ["1.5rem 1.5rem", "0.75rem 1.5rem"]);
  const navbarWidth = useTransform(scrollY, [0, 50], ["100%", "95%"]);
  const navbarBorderRadius = useTransform(scrollY, [0, 50], ["0px", "9999px"]);
  const navbarBgOpacity = useTransform(scrollY, [0, 50], [0.8, 0.6]);
  const navbarShadow = useTransform(scrollY, [0, 50], ["none", "0 25px 50px -12px rgba(0, 0, 0, 0.5)"]);

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

  const navLinks = [
    { name: 'Features', href: '/#benefits' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'FAQ', href: '/#faq' },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <motion.nav
        style={{
          y: navbarY,
          width: navbarWidth,
          borderRadius: navbarBorderRadius,
          backgroundColor: `rgba(10, 10, 10, ${navbarBgOpacity})`,
          boxShadow: navbarShadow,
        }}
        className="pointer-events-auto backdrop-blur-md border border-border/50 bg-background/80 overflow-hidden"
      >
        <motion.div 
          style={{ padding: navbarPadding }}
          className="max-w-7xl mx-auto flex items-center justify-between"
        >
          <Link href="/" className="flex items-center space-x-2 shrink-0">
            <Image src="/images/icon-primary.png" alt="Radius Logo" width={40} height={40} className="w-8 h-8 md:w-10 md:h-10" />
            <span className="text-xl md:text-2xl font-display font-bold text-foreground">Radius</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link 
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === link.href ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {link.name}
              </Link>
            ))}
            
            {!loading && (
              <div className="flex items-center space-x-4 border-l border-border pl-8">
                {user ? (
                  <Link href="/overview" className="flex items-center space-x-3 group">
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors hidden lg:inline">
                      Dashboard
                    </span>
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt={userName}
                        className="w-8 h-8 rounded-full border border-border group-hover:border-primary transition-colors"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-border group-hover:border-primary transition-colors">
                        <FiUser className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </Link>
                ) : (
                  <Button
                    onClick={handleGetStarted}
                    disabled={isSigningIn}
                    variant="default"
                    size="sm"
                    className="rounded-full px-6 font-semibold shadow-lg shadow-primary/20"
                  >
                    {isSigningIn ? (
                      <span className="flex items-center">
                        Signing in...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <FaGoogle className="mr-2 text-xs" />
                        Log In
                      </span>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden flex items-center gap-4">
            {!loading && user && (
               <Link href="/overview" className="w-8 h-8 rounded-full overflow-hidden border border-border shrink-0">
                  <img src={avatarUrl || ''} alt={userName} className="w-full h-full object-cover" />
               </Link>
            )}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-foreground hover:bg-muted rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </motion.div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl"
            >
              <div className="px-6 py-8 flex flex-col space-y-6">
                {navLinks.map((link) => (
                  <Link 
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
                {!loading && !user && (
                   <Button
                    onClick={handleGetStarted}
                    disabled={isSigningIn}
                    variant="default"
                    className="w-full rounded-xl py-6 font-bold"
                  >
                    <FaGoogle className="mr-3" />
                    Get Started with Google
                  </Button>
                )}
                {!loading && user && (
                   <Link 
                    href="/overview"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center p-4 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20"
                  >
                    Go to Dashboard
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </div>
  );
}
