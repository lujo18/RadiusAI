/**
 * Subscription Status Utilities
 * 
 * Helper functions to check subscription status and enforce paywall
 */

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

console.log("ADMIN", supabaseAdmin)

export interface SubscriptionStatus {
  isActive: boolean;
  status: string | null;
  plan: string | null;
  currentPeriodEnd: Date | null;
  daysRemaining: number | null;
}

/**
 * Check if user has an active subscription
 * @param userId - Supabase user ID
 * @returns Subscription status object
 */
export async function checkSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('subscription_status, subscription_plan, current_period_end')
    .eq('id', userId)
    .single();

  if (error || !user) {
    return {
      isActive: false,
      status: null,
      plan: null,
      currentPeriodEnd: null,
      daysRemaining: null,
    };
  }

  const activeStatuses = ['active', 'trialing'];
  const isActive = activeStatuses.includes(user.subscription_status || '');

  let currentPeriodEnd: Date | null = null;
  let daysRemaining: number | null = null;

  if (user.current_period_end) {
    currentPeriodEnd = new Date(user.current_period_end);
    const now = new Date();
    daysRemaining = Math.ceil((currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  return {
    isActive,
    status: user.subscription_status,
    plan: user.subscription_plan || null,
    currentPeriodEnd,
    daysRemaining,
  };
}

/**
 * Require active subscription or throw error
 * Use this in API routes to enforce paywall
 */
export async function requireActiveSubscription(userId: string): Promise<void> {
  const status = await checkSubscriptionStatus(userId);

  if (!status.isActive) {
    throw new Error('Active subscription required');
  }
}

/**
 * Get subscription details for a user
 */
export async function getSubscriptionDetails(userId: string) {
  const { data: profile, error } = await supabaseAdmin
    .from('users')
    .select('stripe_customer_id, stripe_subscription_id, subscription_status, current_period_end')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    return null;
  }

  return profile;
}

/**
 * Check if user is past due on payment
 */
export async function isPaymentPastDue(userId: string): Promise<boolean> {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('subscription_status')
    .eq('id', userId)
    .single();

  return user?.subscription_status === 'past_due';
}
