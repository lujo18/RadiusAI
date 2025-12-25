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
    // Development mode bypass
    const paywallEnabled = process.env.NEXT_PUBLIC_ENABLE_PAYWALL === 'true';
    
    if (!paywallEnabled) {
      // In dev mode, act as if user has active subscription
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
        .from('profiles')
        .select('subscription_status, plan')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        const profile = data as any; // Type assertion until DB types are regenerated
        const isActive = profile.subscription_status === 'active' || profile.subscription_status === 'trialing';
        setSubscriptionStatus({
          isActive,
          isLoading: false,
          plan: profile.plan,
          status: profile.subscription_status,
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
