"use client";

import React, { useEffect, useState } from "react";
import { SubscriptionManagement } from "@/components/billingsdk/subscription-management";
import { type CurrentPlan, plans } from "@/lib/billingsdk-config";
import { useCreatePortal, useSubscription } from '@/features/subscription/hooks';
import { useUserProfile } from '@/features/user/hooks';
import { Currency } from "lucide-react";
import { getCurrencySymbol, formatCurrency } from '@/lib/currency';

export default function BillingPage() {
  const { data: subscription, isLoading } = useSubscription();
  const createPortal = useCreatePortal();
  const { data: user } = useUserProfile();

  // Map subscription data to CurrentPlan
  const mapSubscriptionToPlan = (): CurrentPlan => {
    // Build a Plan object that satisfies the CurrentPlan type
    const subscriptionData = (subscription?.items as any)?.data?.[0];

    // When expanded, the price.product may be the full product object
    const prodObj = subscriptionData?.price?.product ?? (subscriptionData?.plan?.product ?? null);
    
    console.log(subscription)
    
    // use shared util
    const getCurrencySymbolLocal = getCurrencySymbol;

    const planData = {
      id: prodObj?.id ?? subscriptionData?.plan?.product,
      title: prodObj?.name ?? prodObj?.title ?? 'Unknown Plan',
      description: prodObj?.description ?? '',
      monthlyPrice: (subscription as any)?.amount_due_display,
      yearlyPrice: (subscription as any)?.amount_due_display,
      currency: getCurrencySymbolLocal((subscription as any)?.currency),
      buttonText: 'Manage',
      features: [],
    } as any;

    // Safely read next billing timestamp from subscription
    const cpeCandidate = subscriptionData?.current_period_end
      

    const formatUnixToDisplay = (ts: number | string | null) => {
      if (!ts) return "-";
      const n = typeof ts === "string" ? Number(ts) : ts;
      if (!n || Number.isNaN(n)) return "-";
      const d = new Date(n * 1000);
      const pad = (v: number) => String(v).padStart(2, "0");
      return `${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())}/${d.getUTCFullYear()} ${pad(
        d.getUTCHours()
      )}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
    };

    const nextBillingDate = formatUnixToDisplay(cpeCandidate);
    const paymentMethod = (subscription as any)?.default_payment_method || (subscription as any)?.default_source || "Not set";
    const status = (subscription?.status as any) || "inactive";
    const amount = subscriptionData?.plan?.unit_amount ?? (subscription as any)?.amount_due ?? null;
    const price = amount != null ? formatCurrency(Number(amount), (subscription as any)?.currency) : formatCurrency(null, (subscription as any)?.currency);

    return {
      plan: planData as unknown as CurrentPlan["plan"],
      type: "monthly",
      price,
      nextBillingDate,
      paymentMethod,
      status: status as "active" | "inactive" | "past_due" | "cancelled",
    } as CurrentPlan;
  };

  if (subscription?.plan) {
    try {
      const planObj =
        typeof subscription.plan === "string"
          ? JSON.parse(subscription.plan)
          : subscription.plan;
      console.log("Plan", planObj?.product);
    } catch (e) {
      console.log("Plan parse error", e);
    }
  }

  const currentPlan = mapSubscriptionToPlan();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Billing</h1>
        <p className="text-foreground/60">
          Manage your subscription and billing settings
        </p>
      </div>


      <SubscriptionManagement
        className="max-w-2xl"
        currentPlan={currentPlan}
        updatePlan={{
          currentPlan: currentPlan.plan,
          plans: plans,
          onPlanChange: (planId) => {
            console.log("update plan", planId);
          },
          triggerText: "Update Plan",
        }}
        cancelSubscription={{
          title: "Cancel Subscription",
          description: "Are you sure you want to cancel your subscription?",
          plan: currentPlan.plan,
          warningTitle: "You will lose access to premium features",
          warningText:
            "If you cancel your subscription, you will lose access to premium features. Your data will be retained for 30 days.",
          onCancel: async (planId) => {
              try {
              const res = await createPortal.mutateAsync((user as any).id);     
              if (res?.url) {
                window.open(res.url, "_blank");
              }
            } catch (err) {
              console.error(err);
            }
          },
          onKeepSubscription: async (planId) => {
            console.log("keep subscription", planId);
          },
        }}
        openPortal={async () => {
          try {
            const res = await createPortal.mutateAsync((user as any).id);
            if (res?.url) window.open(res.url, "_blank");
          } catch (err) {
            console.error(err);
          }
        }}
      />
    </div>
  );
}
