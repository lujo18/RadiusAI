'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Check, Loader2, Zap, ArrowRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import type { PlanKey } from '@/lib/plans';

/**
 * Unified SubscriptionStatus component: displays active plan with credits,
 * features, renewal info, and subscription management in a single card.
 *
 * Merges CurrentPlanCard UI/features with SubscriptionStatus functionality.
 */

interface SubscriptionStatusProps {
  // Subscription management
  status: string;
  portalLoading: boolean;
  onOpenPortal: () => Promise<void>;

  // Plan details
  planKey: PlanKey | null;
  planName: string;
  planDescription: string;
  features: string[];

  // Usage & renewal
  creditsUsed: number;
  creditsLimit: number | null;
  renewalDate: Date | null;
  daysRemaining: number | null;

  // UI state
  isLoading: boolean;
  error: string | null;
}

export const SubscriptionStatus = ({
  status,
  portalLoading,
  onOpenPortal,
  planKey,
  planName,
  planDescription,
  features,
  creditsUsed,
  creditsLimit,
  renewalDate,
  daysRemaining,
  isLoading,
  error,
}: SubscriptionStatusProps) => {
  const router = useRouter();
  const params = useParams();
  const teamId = params?.teamId as string;

  const creditsPercent =
    creditsLimit && creditsLimit > 0 ? (creditsUsed / creditsLimit) * 100 : 0;
  const creditsRemaining = creditsLimit ? Math.max(0, creditsLimit - creditsUsed) : null;
  const isCritical = creditsRemaining !== null && creditsRemaining < 10;

  const handleManagePlan = () => {
    router.push(`/${teamId}/settings/billing`);
  };

  const handleUpgrade = () => {
    router.push(`/${teamId}/settings/billing?upgrade=true`);
  };

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">Subscription Information Unavailable</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground/60">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden')}>
      {/* Header with plan name, description, and status badge */}
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-2xl text-foreground">{planName}</CardTitle>
            <p className="text-sm text-foreground/60 mt-1">{planDescription}</p>
          </div>
          <Badge variant="outline" className="ml-4 flex-shrink-0">
            <Zap className="h-3 w-3 mr-1" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Credits/Usage Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Credits Used</label>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-foreground/40" />
            ) : (
              <span className={cn('text-sm font-semibold', isCritical && 'text-destructive')}>
                {creditsUsed} {creditsLimit ? `/ ${creditsLimit}` : '/ Unlimited'}
              </span>
            )}
          </div>
          {creditsLimit && !isLoading && (
            <>
              <Progress value={creditsPercent} className="h-2" />
              <p className="text-xs text-foreground/50">
                {creditsRemaining !== null && (
                  <span>
                    {creditsRemaining} credits remaining
                    {isCritical && <span className="text-destructive ml-1">(running low)</span>}
                  </span>
                )}
              </p>
            </>
          )}
        </div>

        {/* Renewal Information */}
        {renewalDate && daysRemaining !== null && (
          <div className="flex items-start gap-3 p-3 bg-foreground/5 rounded-lg">
            <Calendar className="h-4 w-4 text-foreground/60 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Renews on</p>
              <p className="text-xs text-foreground/70">
                {renewalDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              <p className="text-xs text-foreground/50 mt-1">
                {daysRemaining > 0
                  ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`
                  : 'Renewing soon'}
              </p>
            </div>
          </div>
        )}

        {/* Key Features */}
        {features.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Key Features</p>
            <ul className="space-y-1.5">
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground/80">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleManagePlan}>
              Manage Plan
            </Button>
            {planKey && planKey !== 'unlimited' && (
              <Button className="flex-1" onClick={handleUpgrade}>
                Upgrade
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Portal Button */}
          <Button
            onClick={onOpenPortal}
            disabled={portalLoading}
            className="w-full"
            variant="secondary"
          >
            {portalLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Opening Subscription Manager…
              </>
            ) : (
              'Manage Subscription'
            )}
          </Button>
          <p className="text-xs text-foreground/50 text-center">
            Update payment methods, adjust billing frequency, or cancel
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatus;
