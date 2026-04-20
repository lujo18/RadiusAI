"use client";

import React, { useRef, useEffect, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { useSubscription } from '@/features/subscription/hooks';
import { SubscriptionStatus } from '@/features/subscription/SubscriptionStatus';
import { NoSubscription } from "@/features/depreciated-stripe/subscription";
import { toPlanKey, type PlanKey } from "@/lib/plans";
import { switchPlan, openPortal } from "@/features/subscription/actions";
import PricingSection from '@/components/billing/PricingSection';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentHistory } from "@/features/depreciated-stripe/billing";
import { useCurrentPlanDisplay } from "@/hooks/useCurrentPlanDisplay";
import { useInvoices } from '@/features/billing/invoices/hooks';


async function fetchAvailableUpgrades(): Promise<any[]> {
  try {
    const { supabase } = await import('@/lib/supabase/client');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];
    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
    const res = await fetch(`${apiBase}/api/billing/available-upgrades`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { upgrades?: any[] };
    return data.upgrades || [];
  } catch {
    return [];
  }
}

const PLAN_HIGHLIGHT: PlanKey = 'growth'; // highlighted when ?upgrade=true


export default function BillingPage() {
  const searchParams = useSearchParams();
  const highlightUpgrade = searchParams.get('upgrade') === 'true';
  const params = useParams();
  const teamId = (params as any)?.teamId as string | undefined;
  const plansRef = useRef<HTMLDivElement>(null);

  // Subscription and plan display data
  const { data: subscription, isLoading, error } = useSubscription();
  const {
    planKey,
    planName,
    planDescription,
    features,
    creditsUsed,
    creditsLimit,
    renewalDate,
    daysRemaining,
    isLoading: planLoading,
    error: planError,
  } = useCurrentPlanDisplay();

  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices(teamId);

  const [portalLoading, setPortalLoading] = useState(false);
  const [switchingPlan, setSwitchingPlan] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);

  // Scroll to plans section when ?upgrade=true
  useEffect(() => {
    if (highlightUpgrade && plansRef.current) {
      setTimeout(() => {
        plansRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [highlightUpgrade]);

  const handleOpenPortal = async () => {
    setPortalLoading(true);
    try {
      await openPortal();
    } catch (err) {
      console.error('Failed to open portal:', err);
    } finally {
      setPortalLoading(false);
    }
  };

  const handleSwitchPlan = async (priceId: string, productId: string) => {
    setSwitchingPlan(productId);
    setSwitchError(null);
    try {
      await switchPlan(priceId, productId);
      window.location.reload();
    } catch (err: unknown) {
      setSwitchError(err instanceof Error ? err.message : 'Failed to switch plan. Please try again.');
    } finally {
      setSwitchingPlan(null);
    }
  };

  const status = (subscription as Record<string, unknown> | null | undefined)?.status as string || 'inactive';

  // Determine if anything is loading (subscription, plan display, & invoices)
  const isPageLoading = isLoading || planLoading || invoicesLoading;

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Billing</h1>
        <p className="text-foreground/60">
          Manage your subscription and billing settings
        </p>
      </div>

      {/* Loading State */}
      {isPageLoading ? (
        <>
          {/* Subscription Status Skeleton */}
          <Card className="">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-8 w-32 rounded" />
                  <Skeleton className="h-4 w-48 rounded" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </CardContent>
          </Card>

          {/* Plan Cards Skeleton */}
          <div className="space-y-6">
            <div>
              <Skeleton className="h-6 w-32 rounded mb-2" />
              <Skeleton className="h-4 w-64 rounded" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-24 rounded" />
                      <Skeleton className="h-4 w-32 rounded" />
                    </div>
                    <Skeleton className="h-8 w-full rounded" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full rounded" />
                      <Skeleton className="h-4 w-3/4 rounded" />
                    </div>
                    <Skeleton className="h-10 w-full rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Payment History Skeleton */}
          <Card className="max-w-4xl">
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : subscription ? (
        <>
        {/* Unified Subscription Status Card */}
        <SubscriptionStatus
          status={status}
          planKey={planKey}
          planName={planName}
          planDescription={planDescription}
          features={features}
          creditsUsed={creditsUsed}
          creditsLimit={creditsLimit}
          renewalDate={renewalDate}
          daysRemaining={daysRemaining}
          isLoading={planLoading}
          error={planError}
          portalLoading={portalLoading}
          onOpenPortal={handleOpenPortal}
        />

        {/* ── Plan Cards ── */}
      <div ref={plansRef} className="scroll-mt-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            {planKey ? 'Switch Plan' : 'Choose a Plan'}
          </h2>
          <p className="text-sm text-foreground/60 mt-1">
            {planKey
              ? 'Upgrade or downgrade at any time. Changes are prorated immediately.'
              : 'Get started with a plan that fits your workflow.'}
          </p>
        </div>

        {switchError && (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {switchError}
          </div>
        )}

         
        <div>
          <PricingSection teamId={teamId} />
        </div>
      </div>

      {/* Payment History */}
      <PaymentHistory invoices={invoices} isLoading={invoicesLoading} />
        </>
      ) : (
        <NoSubscription />
      )}
    </div>
  );
}
