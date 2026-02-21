
"use client";

import React from "react";
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { FiZap } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useAuthStore } from '@/store';
import { signInWithEmail, signInWithGoogle } from '@/lib/supabase/auth';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { user: supabaseUser, session } = await signInWithEmail(formData.email, formData.password);
      
      if (!supabaseUser || !session) {
        throw new Error('Login failed');
      }
      
      // Create user object for store
      const user = {
        id: supabaseUser.id,
        name: supabaseUser.email?.split('@')[0] || 'User',
        email: supabaseUser.email || '',
        plan: 'starter' as const, // Will be redirected to paywall if no subscription
      };
      
      login(user, supabaseUser, session);
      
      // Use window.location for full page reload to ensure middleware picks up session
      window.location.href = '/overview';
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await signInWithGoogle();
      // OAuth will redirect, so no need to handle response here
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
      setIsLoading(false);
    }
  };

  const handleContinueWithEmail = () => {
    setShowEmailForm(true);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="max-w-md w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center mb-12">
            <FiZap className="text-primary text-3xl mr-2" />
            <span className="text-2xl font-bold text-foreground">
              Radius
            </span>
          </Link>

          {/* Welcome Text */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Welcome Back
            </h1>
            <p className="text-muted-foreground">
              Log in to continue automating your content
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
              <Button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-muted border border hover:border/50 hover:bg-muted/80 disabled:border disabled:cursor-not-allowed disabled:bg-muted py-3 px-4 rounded-lg font-medium text-foreground transition-all shadow-lg"
              >
                <FcGoogle className="text-2xl" />
                Continue with Google
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-background text-muted-foreground">Or</span>
                </div>
              </div>

              {/* Email Button */}
              <Button
                onClick={handleContinueWithEmail}
                className="w-full bg-primary hover:bg-primary/80 text-primary-foreground py-3 px-4 rounded-lg font-semibold transition-all shadow-lg hover:shadow-primary/50"
              >
                Continue with Email
              </Button>
            </>
          ) : (
            <>
              {/* Email Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-muted border border rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition text-foreground placeholder-muted-foreground"
                    placeholder="name@company.com"
                  />
                </div>

                <div>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-muted border border rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition text-foreground placeholder-muted-foreground"
                    placeholder="Password"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center text-muted-foreground">
                    <input type="checkbox" className="mr-2 rounded border bg-muted" />
                    <span>Remember me</span>
                  </label>
                  <a href="#" className="text-primary hover:text-primary/80 transition">
                    Forgot password?
                  </a>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/80 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-primary/50"
                >
                  {isLoading ? 'Logging in...' : 'Log In'}
                </Button>
              </form>

              {/* Back to Options */}
              <Button
                onClick={() => setShowEmailForm(false)}
                className="w-full mt-4 text-primary-400 hover:text-primary-300 text-sm font-medium transition"
              >
                ← Back to sign-in options
              </Button>
            </>
          )}

          {/* Don't have account */}
          <div className="mt-8 text-center text-gray-400">
            Don't have an account?{' '}
            <Link href="/signup" className="text-primary-400 hover:text-primary-300 font-semibold transition">
              Sign up
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
