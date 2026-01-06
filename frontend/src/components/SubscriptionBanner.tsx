'use client';
import React from "react";
import { useRouter } from 'next/navigation';
import { FiAlertCircle, FiZap } from 'react-icons/fi';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';
import { Button } from './ui/button';

export default function SubscriptionBanner() {
  const router = useRouter();
  const { isActive, isLoading, status } = useSubscriptionGuard();

  // Don't show during development or if loading
  if (isLoading) return null;
  
  // Don't show if subscription is active
  if (isActive) return null;

  // Show banner for inactive/no subscription
  return (
    <div className="glass-card p-4 mb-6 border-2 border-chart-1/30 bg-chart-1/10">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FiAlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
          <div>
            <h3 className="text-foreground font-semibold">Subscription Required</h3>
            <p className="text-sm text-muted-foreground">
              {status === 'canceled' 
                ? 'Your subscription has ended. Reactivate to continue using ViralStack.'
                : status === 'past_due'
                ? 'Your payment is past due. Please update your payment method.'
                : 'Subscribe to unlock all features and start creating amazing content.'}
            </p>
          </div>
        </div>
                <Button
                  onClick={() => router.push('/pricing')}
                  className="btn-primary flex items-center gap-2 flex-shrink-0"
                >
                  <FiZap className="w-5 h-5" />
                  {status === 'canceled' ? 'Reactivate' : status === 'past_due' ? 'Update Payment' : 'Subscribe Now'}
                </Button>
      </div>
    </div>
  );
}
