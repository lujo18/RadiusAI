"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { FiAlertCircle, FiZap } from "react-icons/fi";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import { Button } from "./ui/button";
import { DotPattern } from "./ui/dot-pattern";
import { LightRays } from "./ui/light-rays";

export default function SubscriptionBanner() {
  const router = useRouter();
  const { isActive, isLoading, status } = useSubscriptionGuard();

  const {teamId} = useParams();

  // Don't show during development or if loading
  if (isLoading) return null;

  // Don't show if subscription is active
  if (isActive) return null;

  // Show banner for inactive/no subscription
  return (
    <div className="relative rounded-xl border border-sidebar-border mt-2 overflow-hidden p-4">
      <DotPattern glow/>
      <LightRays/>
      <div className="z-2 flex items-center justify-between gap-4">
        <div className="flex items-center">
          <div>
            <h3 className="text-foreground font-semibold text-2xl">
              Subscription Required
            </h3>
            <p className="text-sm muted mt-2">
              {status === "canceled"
                ? "Your subscription has ended. Reactivate to continue using Radius."
                : status === "past_due"
                  ? "Your payment is past due. Please update your payment method."
                  : "Subscribe to unlock all features and start creating amazing content."}
            </p>
          </div>
        </div>
        <Button
          onClick={() => router.push(`/${teamId}/settings/billing?upgrade=true`)}
          className="btn-primary flex items-center gap-2 flex-shrink-0"
        >
          <FiZap className="w-5 h-5" />
          {status === "canceled"
            ? "Reactivate"
            : status === "past_due"
              ? "Update Payment"
              : "Subscribe Now"}
        </Button>
      </div>
    </div>
  );
}
