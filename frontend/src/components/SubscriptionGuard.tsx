import React from "react";
/**
 * SubscriptionGuard Component
 * 
 * Wrapper component to protect features behind active subscription
 */

'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useSubscription } from '@/hooks/useSubscription';
import { FiAlertCircle, FiCreditCard } from 'react-icons/fi';

interface SubscriptionGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

export function SubscriptionGuard({
  children,
  fallback,
  showUpgradePrompt = true,
}: SubscriptionGuardProps) {
  const { isActive, isLoading, status, daysRemaining } = useSubscription();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isActive) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showUpgradePrompt) {
      return (
        <div className="max-w-2xl mx-auto p-8">
          <div className="glass-card p-8 text-center">
            <FiAlertCircle className="text-yellow-500 text-5xl mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {status === 'past_due' 
                ? 'Payment Issue' 
                : status === 'canceled'
                ? 'Subscription Canceled'
                : 'Active Subscription Required'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {status === 'past_due'
                ? 'Your payment failed. Please update your payment method to restore access.'
                : status === 'canceled'
                ? 'Your subscription has been canceled. Reactivate to continue using ViralStack.'
                : 'You need an active subscription to access this feature.'}
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/pricing"
                className="btn-primary inline-flex items-center gap-2"
              >
                <FiCreditCard />
                {status === 'past_due' || status === 'canceled' 
                  ? 'Manage Subscription' 
                  : 'View Plans'}
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return null;
  }

  // Show warning if subscription expires soon
  if (daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0) {
    return (
      <>
        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <FiAlertCircle className="text-yellow-500 text-xl flex-shrink-0" />
            <div className="flex-1">
              <p className="text-yellow-400 text-sm font-medium">
                Your subscription expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
              </p>
              <Link
                href="/api/stripe/customer-portal"
                className="text-yellow-300 hover:text-yellow-200 text-sm underline"
              >
                Manage subscription
              </Link>
            </div>
          </div>
        </div>
        {children}
      </>
    );
  }

  return <>{children}</>;
}
