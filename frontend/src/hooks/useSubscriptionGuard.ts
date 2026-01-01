import React from "react";
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store';
import { supabase } from '@/lib/supabase/client';

interface SubscriptionStatus {
  isActive: boolean;
  isLoading: boolean;
  plan: string | null;
  status: string | null;
}

/**
 * Hook to check subscription status with development mode bypass
 * Set NEXT_PUBLIC_ENABLE_PAYWALL=false in .env.local to bypass during development
 */
export function useSubscriptionGuard(): SubscriptionStatus {
  const user = useAuthStore((state) => state.user);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    isActive: false,
    isLoading: true,
    plan: null,
    status: null,
  });

  useEffect(() => {
    checkSubscription();
  }, [user?.id]);

  const checkSubscription = async () => {
    // Development mode bypass - set NEXT_PUBLIC_ENABLE_PAYWALL=false to disable paywall
    const paywallEnabled = process.env.NEXT_PUBLIC_ENABLE_PAYWALL !== 'false';
    
    if (!paywallEnabled) {
      // In dev mode with paywall disabled, act as if user has active subscription
      setSubscriptionStatus({
        isActive: true,
        isLoading: false,
        plan: 'development',
        status: 'active',
      });
      return;
    }

    // Production: Check actual subscription
    if (!user?.id) {
      setSubscriptionStatus({
        isActive: false,
        isLoading: false,
        plan: null,
        status: null,
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('subscription_status, subscription_plan')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        const userData = data as any;
        const isActive = userData.subscription_status === 'active' || userData.subscription_status === 'trialing';
        setSubscriptionStatus({
          isActive,
          isLoading: false,
          plan: userData.subscription_plan,
          status: userData.subscription_status,
        });
      } else {
        setSubscriptionStatus({
          isActive: false,
          isLoading: false,
          plan: null,
          status: null,
        });
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscriptionStatus({
        isActive: false,
        isLoading: false,
        plan: null,
        status: null,
      });
    }
  };

  return subscriptionStatus;
}

/**
 * Simple function to check if feature should be locked
 * Returns false during development (paywall disabled)
 */
export function isFeatureLocked(): boolean {
  const paywallEnabled = process.env.NEXT_PUBLIC_ENABLE_PAYWALL === 'true';
  return paywallEnabled;
}
