'use client';

import React from 'react';
import { Zap, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentPlanDisplay } from '@/hooks/useCurrentPlanDisplay';

/**
 * PlanMetricsRow: Compact display of credits remaining.
 * Useful for dashboard headers or sidebars.
 */
export function PlanMetricsRow() {
  const { creditsUsed, creditsLimit, isLoading } = useCurrentPlanDisplay();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-foreground/60">
        <div className="h-4 w-4 bg-foreground/10 rounded animate-pulse" />
        <span>Loading credits...</span>
      </div>
    );
  }

  const creditsRemaining = creditsLimit ? Math.max(0, creditsLimit - creditsUsed) : null;
  const isCritical = creditsRemaining !== null && creditsRemaining < 10;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
        isCritical ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
      )}
    >
      {isCritical ? (
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
      ) : (
        <Zap className="h-4 w-4 flex-shrink-0" />
      )}
      <span>
        {creditsRemaining !== null
          ? `${creditsRemaining} credit${creditsRemaining !== 1 ? 's' : ''} left`
          : 'Unlimited credits'}
      </span>
    </div>
  );
}
