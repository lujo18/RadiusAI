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
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('subscription_status, current_period_end')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        const activeStatuses = ['active', 'trialing'];
        const isActive = activeStatuses.includes((profile as any)?.subscription_status || '');

        let currentPeriodEnd: Date | null = null;
        let daysRemaining: number | null = null;

        if ((profile as any)?.current_period_end) {
          currentPeriodEnd = new Date((profile as any).current_period_end);
          const now = new Date();
          daysRemaining = Math.ceil(
            (currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
        }

        setSubscriptionData({
          status: (profile as any)?.subscription_status || null,
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

    // Set up real-time subscription to profile changes
    const channel = supabase
      .channel(`subscription:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const profile = payload.new as any;
          const activeStatuses = ['active', 'trialing'];
          const isActive = activeStatuses.includes(profile?.subscription_status || '');

          let currentPeriodEnd: Date | null = null;
          let daysRemaining: number | null = null;

          if (profile?.current_period_end) {
            currentPeriodEnd = new Date(profile.current_period_end);
            const now = new Date();
            daysRemaining = Math.ceil(
              (currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );
          }

          setSubscriptionData({
            status: profile?.subscription_status || null,
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
