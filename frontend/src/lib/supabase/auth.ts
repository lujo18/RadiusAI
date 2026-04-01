/**
 * Authentication Service - Supabase
 * 
 * Handles all authentication operations using Supabase Auth
 */

import { supabase } from './client';
import type { AuthError, User, Session } from '@supabase/supabase-js';

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

const parseJsonSafe = (text: string): any | null => {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

// =====================================================
// EMAIL/PASSWORD AUTHENTICATION
// =====================================================

/**
 * Sign up with email and password
 */
export const signUpWithEmail = async (
  email: string,
  password: string,
  metadata?: { name?: string; [key: string]: any }
): Promise<AuthResponse> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata || {},
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to create account');
  }

  return { user: data.user, session: data.session, error: null };
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message || 'Failed to sign in');
  }

  return { user: data.user, session: data.session, error: null };
};

// =====================================================
// OAUTH AUTHENTICATION
// =====================================================

/**
 * Sign in with Google OAuth
 */
export const signInWithGoogle = async (): Promise<void> => {
  // Use server-side signin to ensure PKCE verifier is stored in cookies
  const res = await fetch('/api/v1/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'google', redirectTo: `${window.location.origin}/auth/callback` }),
  });

  const payloadText = await res.text();
  const payload = parseJsonSafe(payloadText);
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to start Google sign-in');
  }

  // If server returned a redirect URL, navigate there
  if (payload.url) {
    window.location.href = payload.url;
  }
};

/**
 * Sign in with GitHub OAuth
 */
export const signInWithGitHub = async (): Promise<void> => {
  const res = await fetch('/api/v1/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'github', redirectTo: `${window.location.origin}/auth/callback` }),
  });

  const payloadText = await res.text();
  const payload = parseJsonSafe(payloadText);
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to start GitHub sign-in');
  }

  if (payload.url) {
    window.location.href = payload.url;
  }
};

// =====================================================
// SESSION MANAGEMENT
// =====================================================

/**
 * Get current user
 */
export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

/**
 * Get current session
 */
export const getCurrentSession = async (): Promise<Session | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

/**
 * Sign out
 */
export const logOut = async (): Promise<void> => {
  const { error: globalError } = await supabase.auth.signOut({ scope: 'global' });

  // If global revocation fails (network/session edge cases), still clear local auth state.
  if (globalError) {
    const { error: localError } = await supabase.auth.signOut({ scope: 'local' });
    if (localError) {
      throw new Error(localError.message || globalError.message || 'Failed to sign out');
    }
  }
};

// =====================================================
// PASSWORD MANAGEMENT
// =====================================================

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  if (error) {
    throw new Error(error.message || 'Failed to send reset email');
  }
};

/**
 * Update password (requires user to be signed in)
 */
export const updatePassword = async (newPassword: string): Promise<void> => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new Error(error.message || 'Failed to update password');
  }
};

// =====================================================
// PROFILE MANAGEMENT
// =====================================================

/**
 * Update user profile information
 */
export const updateProfile = async (data: {
  name?: string;
  avatar_url?: string;
}): Promise<void> => {
  const { error } = await supabase.auth.updateUser({
    data,
  });

  if (error) {
    throw new Error(error.message || 'Failed to update profile');
  }
};

// =====================================================
// AUTH STATE LISTENER
// =====================================================

/**
 * Subscribe to auth state changes
 * Returns unsubscribe function
 */
export const onAuthStateChange = (
  callback: (user: User | null, session: Session | null) => void
) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      callback(session?.user ?? null, session);
    }
  );

  return () => subscription.unsubscribe();
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Get current user ID - throws if not authenticated
 */
export const requireUserId = async (): Promise<string> => {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('User not authenticated');
  }
  
  return user.id;
};

