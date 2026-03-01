"use client";

import React, { useRef, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSubscription } from '@/features/subscription/hooks';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, Check, Zap, ArrowRight, Crown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import backendClient from "@/lib/api/clients/backendClient";
import { PLANS, PLAN_ORDER, toPlanKey, isUpgrade as isPlanUpgrade, type PlanKey } from "@/lib/plans";
import { startCheckout, switchPlan, openPortal } from "@/features/subscription/actions";
import { cn } from "@/lib/utils";
import { useProducts } from "@/features/stripe/products/hooks";
import { productsApi } from "@/lib/api/client";

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  paid_at: number;
  invoice_date: number;
  period_start: number;
  period_end: number;
  pdf_url: string;
}

interface StripeProduct {
  id: string;
  name: string;
  description?: string;
  prices?: { id: string; unit_amount: number; currency: string; recurring?: { interval: string } }[];
}

interface AvailableUpgrade {
  product_id: string;
  price_id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  interval: string;
  metadata: Record<string, string>;
}

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
    const data = await res.json();
    return data.upgrades || [];
  } catch {
    return [];
  }
}

const PLAN_HIGHLIGHT: PlanKey = 'growth'; // highlighted when ?upgrade=true

function formatCurrencyAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase() || 'USD',
    minimumFractionDigits: 0,
  }).format(amount / 100);
}

export default function BillingPage() {
  const searchParams = useSearchParams();
  const highlightUpgrade = searchParams.get('upgrade') === 'true';
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
      await startCheckout(planKey, { cancelUrl: window.location.href });
    } catch (err: unknown) {
      setSwitchError(err instanceof Error ? err.message : 'Failed to start checkout. Please try again.');
    } finally {
      setSwitchingPlan(null);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'trialing':
        return 'bg-green-500';
      case 'past_due':
        return 'bg-yellow-500';
      case 'canceled':
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (timestamp: number | string | null) => {
    if (!timestamp) return 'N/A';
    const ts = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
    return new Date(ts * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number | null, currency: string) => {
    if (amount === null || amount === undefined) return '$0.00';
    const formatted = (amount / 100).toFixed(2);
    const symbol = currency?.toLowerCase() === 'usd' ? '$' : '';
    return `${symbol}${formatted}`;
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
  if (productsLoading) return 
  for (const p of products) {
    const key = toPlanKey(p.name);
    if (key) productByPlanKey.set(key, p);
  }

  // Build a map from planKey → available upgrade data
  const upgradeByPlanKey = new Map<PlanKey, AvailableUpgrade>();
  for (const u of availableUpgrades) {
    const key = toPlanKey(u.name);
    if (key) upgradeByPlanKey.set(key, u);
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Billing</h1>
        <p className="text-foreground/60">
          Manage your subscription and billing settings
        </p>
      </div>

      {/* Current Subscription Status */}
      {isLoading ? (
        <Card className="max-w-2xl">
          <CardContent className="pt-6">
            <p className="text-foreground/60">Loading subscription information…</p>
          </CardContent>
        </Card>
      ) : subscription ? (
        <Card className="max-w-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{planName}</CardTitle>
                <CardDescription>{planDescription}</CardDescription>
              </div>
              <Badge className={getStatusBadgeColor(status)}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-foreground/60 mb-1">Monthly Price</p>
                <p className="text-2xl font-bold text-foreground">{monthlyPrice}</p>
                <p className="text-xs text-foreground/50">per month in {currency}</p>
              </div>
              <div>
                <p className="text-sm text-foreground/60 mb-1">Next Billing Date</p>
                <p className="text-lg font-semibold text-foreground">{nextBillingDate}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <Button
                onClick={handleOpenPortal}
                disabled={portalLoading || !subscription}
                className="w-full"
                variant="default"
              >
                {portalLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opening Subscription Manager…
                  </>
                ) : (
                  'Manage Subscription in Stripe'
                )}
              </Button>
              <p className="text-xs text-foreground/50 mt-3 text-center">
                Update payment methods, adjust billing frequency, or cancel your subscription
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-2xl border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">No active subscription</p>
                <p className="text-sm text-foreground/60 mt-1">
                  Choose a plan below to unlock all features and remove limits.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLAN_ORDER.map((planKey) => {
            const planContent = PLANS[planKey];
            const stripeProduct = productByPlanKey.get(planKey);
            const upgradeData = upgradeByPlanKey.get(planKey);
            const isCurrent = currentPlanKey === planKey;
            const isHighlighted = highlightUpgrade && planKey === PLAN_HIGHLIGHT && !isCurrent;
            const price = stripeProduct?.prices?.[0];
            const priceAmount = price ? formatCurrencyAmount(price.unit_amount, price.currency) : null;
            const interval = price?.recurring?.interval || 'month';
            const isMostPopular = planContent.badge === 'Most Popular';

            // Determine CTA state
            const isUpgradeAvailable = upgradeData && !isCurrent;
            const canCheckout = !subscription && stripeProduct && price;
            const isSwitching = switchingPlan === (stripeProduct?.id ?? price?.id);

            return (
              <Card
                key={planKey}
                className={cn(
                  "overflow-visible relative flex flex-col transition-all duration-200",
                  isCurrent && "border-primary/50 bg-primary/5",
                  isHighlighted && "border-primary ring-2 ring-primary/40 shadow-lg shadow-primary/10",
                  isMostPopular && !isCurrent && "border-primary/30"
                )}
              >
                {/* Badge row */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-2">
                  {isCurrent && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                      <Crown className="h-3 w-3" />
                      Current Plan
                    </span>
                  )}
                  {!isCurrent && planContent.badge && (
                    <span className="inline-flex items-center rounded-full bg-secondary px-3 py-0.5 text-xs font-semibold text-secondary-foreground">
                      {planContent.badge}
                    </span>
                  )}
                </div>

                <CardHeader className="pt-8 pb-4">
                  <CardTitle className="text-lg">{planContent.name}</CardTitle>
                  <CardDescription className="text-xs">{planContent.description}</CardDescription>
                  {productsLoading ? (
                    <div className="h-8 w-20 animate-pulse rounded bg-foreground/10 mt-2" />
                  ) : priceAmount ? (
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-foreground">{priceAmount}</span>
                      <span className="text-foreground/50 text-sm">/{interval}</span>
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-foreground/40">Price unavailable</div>
                  )}
                </CardHeader>

                <CardContent className="flex flex-col flex-1 gap-4">
                  <ul className="space-y-2 flex-1">
                    {planContent.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-foreground/80">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-2">
                    {isCurrent ? (
                      <Button variant="outline" className="w-full" disabled>
                        Current Plan
                      </Button>
                    ) : currentPlanKey && isUpgradeAvailable ? (
                      <Button
                        className="w-full"
                        variant={isMostPopular ? "default" : "outline"}
                        disabled={isSwitching}
                        onClick={() => handleSwitchPlan(upgradeData.price_id, upgradeData.product_id)}
                      >
                        {isSwitching ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Switching…
                          </>
                        ) : (
                          <>
                            {currentPlanKey && isPlanUpgrade(currentPlanKey, planKey) ? 'Upgrade' : 'Downgrade'}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    ) : canCheckout ? (
                      <Button
                        className="w-full"
                        variant={isMostPopular ? "default" : "outline"}
                        disabled={!!switchingPlan}
                        onClick={() => handleCheckout(planKey)}
                      >
                        {isSwitching ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading…
                          </>
                        ) : (
                          <>
                            Get Started
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full" disabled>
                        {upgradesLoading || productsLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Not available'
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-center text-foreground/40">
          All plans include a 7-day money-back guarantee. Cancel anytime.
        </p>
      </div>

      {/* Payment History */}
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Your recent invoices and payments</CardDescription>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-foreground/40" />
            </div>
          ) : invoices && invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-foreground/60 font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-foreground/60 font-medium">Amount</th>
                    <th className="text-left py-3 px-4 text-foreground/60 font-medium">Period</th>
                    <th className="text-left py-3 px-4 text-foreground/60 font-medium">Status</th>
                    <th className="text-right py-3 px-4 text-foreground/60 font-medium">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice: Invoice) => (
                    <tr key={invoice.id} className="border-b border-border hover:bg-foreground/5 transition-colors">
                      <td className="py-3 px-4 text-foreground">
                        {formatDate(invoice.paid_at || invoice.invoice_date)}
                      </td>
                      <td className="py-3 px-4 text-foreground font-semibold">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </td>
                      <td className="py-3 px-4 text-foreground/80 text-xs">
                        {formatDate(invoice.period_start)} — {formatDate(invoice.period_end)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                          Paid
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {invoice.pdf_url ? (
                          <a
                            href={invoice.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                          >
                            <Download className="h-4 w-4" />
                            <span>Download</span>
                          </a>
                        ) : (
                          <span className="text-foreground/40 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-foreground/60">No invoices yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
