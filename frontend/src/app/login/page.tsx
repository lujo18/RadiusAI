'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiZap, FiMail, FiLock } from 'react-icons/fi';
import { useAuthStore } from '@/store';
import { signInWithEmail, signInWithGoogle, signInWithGitHub } from '@/lib/firebase/auth';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
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
      const userCredential = await signInWithEmail(formData.email, formData.password);
      const firebaseUser = userCredential.user;
      const token = await firebaseUser.getIdToken();
      
      // Create user object for store
      const user = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        email: firebaseUser.email || '',
        plan: 'starter' as const,
      };
      
      login(user, token, firebaseUser);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const userCredential = await signInWithGoogle();
      const firebaseUser = userCredential.user;
      const token = await firebaseUser.getIdToken();
      
      const user = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'User',
        email: firebaseUser.email || '',
        plan: 'starter' as const,
      };
      
      login(user, token, firebaseUser);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubSignIn = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const userCredential = await signInWithGitHub();
      const firebaseUser = userCredential.user;
      const token = await firebaseUser.getIdToken();
      
      const user = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'User',
        email: firebaseUser.email || '',
        plan: 'starter' as const,
      };
      
      login(user, token, firebaseUser);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'GitHub sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center mb-8">
          <FiZap className="text-primary-500 text-4xl mr-2" />
          <span className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-pink-600 bg-clip-text text-transparent">
            SlideForge
          </span>
        </Link>

        {/* Login Card */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 backdrop-blur-lg">
          <h1 className="text-3xl font-bold mb-2 text-center">Welcome Back</h1>
          <p className="text-gray-400 text-center mb-8">
            Log in to continue automating your content
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-primary-500 transition"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-primary-500 transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-gray-400">Remember me</span>
              </label>
              <a href="#" className="text-primary-400 hover:text-primary-300">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-700 disabled:cursor-not-allowed py-3 rounded-lg font-semibold transition transform hover:scale-105 active:scale-95"
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div className="mt-6 text-center text-gray-400">
            Don't have an account?{' '}
            <Link href="/signup" className="text-primary-400 hover:text-primary-300 font-semibold">
              Sign up for free
            </Link>
          </div>
        </div>

        {/* Social Login (Optional) */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-black text-gray-400">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <button 
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 border border-gray-700 py-3 rounded-lg font-semibold transition"
            >
              Google
            </button>
            <button 
              onClick={handleGitHubSignIn}
              disabled={isLoading}
              className="bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 border border-gray-700 py-3 rounded-lg font-semibold transition"
            >
              GitHub
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
