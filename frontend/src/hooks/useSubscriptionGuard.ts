import React from "react";
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store';
import { supabase } from '@/lib/supabase/client';
import useSubscription from "@/features/subscription/hooks";

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

  const {data: subscription, error} = useSubscription();

  useEffect(() => {
    setSubscriptionStatus({isActive: subscription?.status === 'active' || subscription?.status === 'trialing', isLoading: false, plan: subscription?.product.id || null, status: subscription?.status || null});
  }, [subscription, error]);

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
