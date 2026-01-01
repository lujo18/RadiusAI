import React from "react";
/**
 * useSubscription Hook
 * 
 * React hook to access subscription status in client components
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store';

export interface SubscriptionData {
  status: string | null;
  currentPeriodEnd: Date | null;
  daysRemaining: number | null;
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useSubscription(): SubscriptionData {
  const { user } = useAuthStore();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    status: null,
    currentPeriodEnd: null,
    daysRemaining: null,
    isActive: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!user?.id) {
      setSubscriptionData({
        status: null,
        currentPeriodEnd: null,
        daysRemaining: null,
        isActive: false,
        isLoading: false,
        error: 'No user found',
      });
      return;
    }

    const fetchSubscription = async () => {
      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('subscription_status, current_period_end')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        const activeStatuses = ['active', 'trialing'];
        const isActive = activeStatuses.includes((userData as any)?.subscription_status || '');

        let currentPeriodEnd: Date | null = null;
        let daysRemaining: number | null = null;

        if ((userData as any)?.current_period_end) {
          currentPeriodEnd = new Date((userData as any).current_period_end);
          const now = new Date();
          daysRemaining = Math.ceil(
            (currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
        }

        setSubscriptionData({
          status: (userData as any)?.subscription_status || null,
          currentPeriodEnd,
          daysRemaining,
          isActive,
          isLoading: false,
          error: null,
        });
      } catch (err: any) {
        console.error('Error fetching subscription:', err);
        setSubscriptionData({
          status: null,
          currentPeriodEnd: null,
          daysRemaining: null,
          isActive: false,
          isLoading: false,
          error: err.message,
        });
      }
    };

    fetchSubscription();

    // Set up real-time subscription to user changes
    const channel = supabase
      .channel(`subscription:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const userData = payload.new as any;
          const activeStatuses = ['active', 'trialing'];
          const isActive = activeStatuses.includes(userData?.subscription_status || '');

          let currentPeriodEnd: Date | null = null;
          let daysRemaining: number | null = null;

          if (userData?.current_period_end) {
            currentPeriodEnd = new Date(userData.current_period_end);
            const now = new Date();
            daysRemaining = Math.ceil(
              (currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );
          }

          setSubscriptionData({
            status: userData?.subscription_status || null,
            currentPeriodEnd,
            daysRemaining,
            isActive,
            isLoading: false,
            error: null,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return subscriptionData;
}
