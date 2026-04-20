'use client';

import React from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import { useCurrentPlanDisplay } from '@/hooks/useCurrentPlanDisplay';

/**
 * BillingCycleInfo: Displays renewal date and days remaining.
 * Used in billing page details section.
 */
export function BillingCycleInfo() {
  const { renewalDate, daysRemaining, isLoading } = useCurrentPlanDisplay();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-foreground/60">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading billing cycle info...</span>
      </div>
    );
  }

  if (!renewalDate) {
    return (
      <div className="text-sm text-foreground/50">Billing cycle information not available</div>
    );
  }

  return (
    <div className="flex items-start gap-3 p-4 bg-foreground/5 rounded-lg border">
      <Calendar className="h-5 w-5 text-foreground/60 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">Next Renewal</p>
        <p className="text-sm text-foreground/70 mt-1">
          {renewalDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
        {daysRemaining !== null && (
          <p className="text-xs text-foreground/50 mt-1">
            {daysRemaining > 0
              ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining in this billing cycle`
              : 'Renewing soon'}
          </p>
        )}
      </div>
    </div>
  );
}
