"use client";

import React, { useRef, useEffect, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { useSubscription } from '@/features/subscription/hooks';
import { useQuery } from "@tanstack/react-query";
import backendClient from "@/lib/api/clients/backendClient";
import { PLANS, PLAN_ORDER, toPlanKey, isUpgrade as isPlanUpgrade, type PlanKey } from "@/lib/plans";
import { switchPlan, openPortal } from "@/features/subscription/actions";
import { useProducts } from "@/features/stripe/products/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plans } from "@/features/stripe/components/Plans";
import { SubscriptionStatus, NoSubscription } from "@/features/stripe/subscription";
import { PaymentHistory } from "@/features/stripe/billing";
import { formatDate, formatCurrency } from "@/features/stripe/utils/formatting";
import type { Invoice } from "@/features/stripe/invoice/types";
import type { StripeProduct } from "@/features/stripe/products/types";
import type { AvailableUpgrade } from "@/features/stripe/plans/types";
import { startCheckout } from "@/features/stripe/checkout/service";

async function fetchInvoices() {
  const response = await backendClient.get('/api/billing/invoices');
  return response.data.invoices;
}


async function fetchAvailableUpgrades(): Promise<AvailableUpgrade[]> {
  try {
    const { supabase } = await import('@/lib/supabase/client');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];
    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
    const res = await fetch(`${apiBase}/api/billing/available-upgrades`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { upgrades?: AvailableUpgrade[] };
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

  const {data: products, isLoading: productsLoading, error: productsError} = useProducts();
  const { data: subscription, isLoading, error } = useSubscription();
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['billing', 'invoices'],
    queryFn: fetchInvoices,
  });
  const { data: availableUpgrades = [], isLoading: upgradesLoading } = useQuery({
    queryKey: ['billing', 'available-upgrades'],
    queryFn: fetchAvailableUpgrades,
  });

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

  const handleCheckout = async (planKey: PlanKey) => {
    setSwitchingPlan(planKey);
    setSwitchError(null);
    try {
      await startCheckout(planKey, window.location.href, teamId);
    } catch (err: unknown) {
      setSwitchError(err instanceof Error ? err.message : 'Failed to start checkout. Please try again.');
    } finally {
      setSwitchingPlan(null);
    }
  };

  const subscriptionItem = subscription?.items?.data?.[0];
  const productInfo = subscriptionItem?.price?.product;
  const planName = productInfo?.name || 'No Plan';
  const planDescription = productInfo?.description || '';
  const monthlyPrice = (subscription as Record<string, unknown> | null | undefined)?.amount_due_display as string || '$0.00';
  const currency = (subscription as Record<string, unknown> | null | undefined)?.currency as string || 'USD';
  const status = (subscription as Record<string, unknown> | null | undefined)?.status as string || 'inactive';
  const nextBillingDate = formatDate((subscription as Record<string, unknown> | null | undefined)?.current_period_end as number);

  // Determine current plan key from subscription
  const currentPlanKey: PlanKey | null = subscription ? toPlanKey(planName) : null;

  // Build a map from planKey → Stripe product data
  const productByPlanKey = new Map<PlanKey, StripeProduct>();
  console.log("PRODUCTS", products)
  for (const p of products) {
    const key = toPlanKey(p.name);
    if (key) productByPlanKey.set(key, p);
  }

  // Determine if anything is loading
  const isPageLoading = productsLoading || isLoading || invoicesLoading || upgradesLoading;

  // Build a map from planKey → available upgrade data
  const upgradeByPlanKey = new Map<PlanKey, AvailableUpgrade>();
  for (const u of availableUpgrades) {
    const key = toPlanKey(u.name);
    if (key) upgradeByPlanKey.set(key, u);
  }

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
          <Card className="max-w-2xl">
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
      ) : (
        <>
          {/* Current Subscription Status */}
          {isLoading ? (
            <Card className="max-w-2xl">
              <CardContent className="pt-6">
                <p className="text-foreground/60">Loading subscription information…</p>
              </CardContent>
            </Card>
          ) : subscription ? (
            <SubscriptionStatus
              planName={planName}
              planDescription={planDescription}
              monthlyPrice={monthlyPrice}
              currency={currency}
              status={status}
              nextBillingDate={nextBillingDate}
              portalLoading={portalLoading}
              onOpenPortal={handleOpenPortal}
            />
          ) : (
            <NoSubscription />
          )}

      {/* ── Plan Cards ── */}
      <div ref={plansRef} className="scroll-mt-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            {currentPlanKey ? 'Switch Plan' : 'Choose a Plan'}
          </h2>
          <p className="text-sm text-foreground/60 mt-1">
            {currentPlanKey
              ? 'Upgrade or downgrade at any time. Changes are prorated immediately.'
              : 'Get started with a plan that fits your workflow.'}
          </p>
        </div>

        {switchError && (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {switchError}
          </div>
        )}

        <Plans
          productByPlanKey={productByPlanKey}
          upgradeByPlanKey={upgradeByPlanKey}
          currentPlanKey={currentPlanKey}
          highlightUpgrade={highlightUpgrade}
          PLAN_HIGHLIGHT={PLAN_HIGHLIGHT}
          formatCurrencyAmount={formatCurrency}
          subscription={subscription}
          switchingPlan={switchingPlan}
          handleSwitchPlan={handleSwitchPlan}
          handleCheckout={handleCheckout}
          productsLoading={productsLoading}
          upgradesLoading={upgradesLoading}
        />
      </div>

      {/* Payment History */}
      <PaymentHistory invoices={invoices} isLoading={invoicesLoading} />
        </>
      )}
    </div>
  );
}
