
import React from "react";
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiZap } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useAuthStore } from '@/store';
import { signUpWithEmail, signInWithGoogle } from '@/lib/supabase/auth';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') || 'growth'; // Default to growth plan
  const login = useAuthStore((state) => state.login);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    try {
      console.log('[Signup] Starting email signup process for plan:', plan);
      const { user: supabaseUser, session } = await signUpWithEmail(
        formData.email,
        formData.password,
        { name: formData.name }
      );
      
      if (!supabaseUser || !session) {
        throw new Error('Signup failed');
      }
      
      console.log('[Signup] Signup successful, user:', supabaseUser.id);
      
      // Create user object for store
      const user = {
        id: supabaseUser.id,
        name: formData.name,
        email: supabaseUser.email || '',
        plan: null, // Will be set after Stripe payment completes
      };
      
      // Set auth store BEFORE redirecting
      console.log('[Signup] Setting auth store...');
      login(user, supabaseUser, session);
      
      // Small delay to ensure store is persisted
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('[Signup] Auth store set, redirecting to checkout with plan:', plan);
      
      // Redirect to checkout page instead of directly to Stripe
      router.push(`/checkout?plan=${plan}`);
    } catch (err: any) {
      console.error('[Signup] Error:', err);
      setError(err.message || 'Signup failed');
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('[Signup] Starting Google OAuth for plan:', plan);
      // Store plan in localStorage so we can retrieve it after OAuth redirect
      localStorage.setItem('selectedPlan', plan);
      console.log('[Signup] Stored plan in localStorage:', plan);
      await signInWithGoogle();
      // OAuth will redirect to /auth/callback
    } catch (err: any) {
      console.error('[Signup] Google OAuth error:', err);
      setError(err.message || 'Google sign-in failed');
      setIsLoading(false);
    }
  };

  const handleContinueWithEmail = () => {
    setShowEmailForm(true);
  };

  return (
    <div className="min-h-screen flex bg-dark-600">
      {/* Left Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="max-w-md w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center mb-12">
            <FiZap className="text-primary-500 text-3xl mr-2" />
            <span className="text-2xl font-bold text-white">
              ViralStack
            </span>
          </Link>

          {/* Welcome Text */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome to ViralStack
            </h1>
            <p className="text-gray-400">
              Get started - it's free. No credit card needed.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {!showEmailForm ? (
            <>
              {/* Google Sign In Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-dark-400 border border-gray-700 hover:border-gray-600 hover:bg-dark-300 disabled:border-gray-800 disabled:cursor-not-allowed disabled:bg-dark-500 py-3 px-4 rounded-lg font-medium text-white transition-all shadow-lg"
              >
                <FcGoogle className="text-2xl" />
                Continue with Google
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-dark-600 text-gray-400">Or</span>
                </div>
              </div>

              {/* Email Button */}
              <button
                onClick={handleContinueWithEmail}
                className="w-full bg-kinetic-mint hover:bg-kinetic-mint/80 text-obsidian py-3 px-4 rounded-lg font-semibold transition-all shadow-lg hover:shadow-kinetic-mint/50"
              >
                Continue with Email
              </button>
            </>
          ) : (
            <>
              {/* Email Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-dark-400 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition text-white placeholder-gray-500"
                    placeholder="Full Name"
                  />
                </div>

                <div>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-dark-400 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition text-white placeholder-gray-500"
                    placeholder="name@company.com"
                  />
                </div>

                <div>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-dark-400 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition text-white placeholder-gray-500"
                    placeholder="Password (min. 8 characters)"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-kinetic-mint hover:bg-kinetic-mint/80 disabled:bg-gray-700 disabled:cursor-not-allowed text-obsidian py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-kinetic-mint/50"
                >
                  {isLoading ? 'Creating Account...' : 'Continue'}
                </button>
              </form>

              {/* Back to Options */}
              <button
                onClick={() => setShowEmailForm(false)}
                className="w-full mt-4 text-primary-400 hover:text-primary-300 text-sm font-medium transition"
              >
                ← Back to sign-in options
              </button>
            </>
          )}

          {/* Already have account */}
          <div className="mt-8 text-center text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-400 hover:text-primary-300 font-semibold transition">
              Log in
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-500 via-accent-purple to-accent-pink relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Animated Background Circles */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-32 right-32 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
          
          {/* Main Illustration Area */}
          <div className="relative z-10 max-w-lg mx-auto px-12">
            {/* Card Stack Illustration */}
            <div className="relative">
              {/* Mock Browser/App Window */}
              <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 transform rotate-2">
                <div className="flex gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                
                {/* Content Lines */}
                <div className="space-y-4">
                  <div className="h-8 bg-gradient-to-r from-primary-200 to-primary-100 rounded"></div>
                  <div className="h-8 bg-gradient-to-r from-accent-purple/30 to-accent-purple/10 rounded"></div>
                  <div className="h-8 bg-gradient-to-r from-accent-pink/30 to-accent-pink/10 rounded"></div>
                  <div className="h-12 bg-gradient-to-r from-primary-300 to-primary-200 rounded-lg"></div>
                </div>

                {/* Colorful Cards */}
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="h-20 bg-gradient-to-br from-green-400 to-green-500 rounded-lg shadow-lg"></div>
                  <div className="h-20 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg shadow-lg"></div>
                  <div className="h-20 bg-gradient-to-br from-purple-400 to-purple-500 rounded-lg shadow-lg"></div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-8 -right-8 text-6xl animate-bounce">
                ✨
              </div>
              <div className="absolute -bottom-6 -left-6 text-5xl animate-pulse">
                🚀
              </div>
              <div className="absolute top-1/2 -right-12 text-4xl animate-spin-slow">
                ⚡
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="mt-12 space-y-4 text-white/90">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur">
                  ✓
                </div>
                <span className="font-medium">AI-powered content generation</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur">
                  ✓
                </div>
                <span className="font-medium">Viral templates & analytics</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur">
                  ✓
                </div>
                <span className="font-medium">Schedule & automate posts</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
