"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { FiCheck, FiTrendingUp } from "react-icons/fi";
import { pricingContent } from "@/content/pricing";
import { PlanKey, PLAN_ORDER } from "@/lib/plans";
import { useRouter } from "next/navigation";

export interface PricingCardsProps {
  /**
   * Current authenticated user's canonical plan key.
   * Pass null / undefined when no user is logged in.
   */
  currentUserPlan?: string | null;
  /**
   * Live price data from Stripe: planKey → { amount (cents), productId }
   * When null the component falls back to the static prices below.
   */
  prices?: Record<string, { amount: number; productId: string }> | null;
  /** Disable buttons and show loading state */
  isLoading?: boolean;
  /**
   * Called when the user clicks a plan CTA.
   * If omitted the component pushes to /pricing?plan=<key>.
   */
  onGetStarted?: (plan: PlanKey) => void;
  /**
   * Called when the upgrade-flow should be triggered for users that
   * already have a lower-tier plan. Only relevant on the billing page.
   */
  onUpgrade?: () => void;
}

const STATIC_PRICES: Record<PlanKey, number> = {
  starter: 19,
  growth: 29,
  unlimited: 99,
};

// Hierarchy for determining "upgrade" badge
const PLAN_RANK: Record<PlanKey, number> = { starter: 0, growth: 1, unlimited: 2 };

function getPlanRank(planName: string): number {
  const n = planName.toLowerCase();
  if (n.includes("unlimited") || n.includes("agency")) return 2;
  if (n.includes("growth") || n.includes("pro")) return 1;
  if (n.includes("starter") || n.includes("free")) return 0;
  return -1;
}

/**
 * Reusable subscription plan cards. Used on both the landing page preview
 * and the full /pricing page.
 */
export function PricingCards({
  currentUserPlan,
  prices,
  isLoading = false,
  onGetStarted,
  onUpgrade,
}: PricingCardsProps) {
  const router = useRouter();

  const currentRank = currentUserPlan ? getPlanRank(currentUserPlan) : -1;

  const isCurrentPlan = (key: PlanKey) => {
    if (!currentUserPlan) return false;
    return getPlanRank(currentUserPlan) === PLAN_RANK[key];
  };

  const isUpgradePlan = (key: PlanKey) => {
    if (!currentUserPlan) return false;
    return PLAN_RANK[key] > currentRank;
  };

  const handleClick = (key: PlanKey) => {
    if (isUpgradePlan(key) && onUpgrade) {
      onUpgrade();
      return;
    }
    if (onGetStarted) {
      onGetStarted(key);
    } else {
      router.push(`/pricing?plan=${key}`);
    }
  };

  const getPrice = (key: PlanKey): number => {
    if (prices && prices[key]) {
      return Math.round(prices[key].amount / 100);
    }
    return STATIC_PRICES[key];
  };

  const plans = PLAN_ORDER.map((key) => ({
    key,
    content: pricingContent.plans[key],
    price: getPrice(key),
    current: isCurrentPlan(key),
    upgrade: isUpgradePlan(key),
  }));

  return (
    <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
      {plans.map(({ key, content, price, current, upgrade }, idx) => {
        const isHighlighted = content.highlight ?? key === "growth";
        const badge = current
          ? "CURRENT PLAN"
          : upgrade
          ? null // shown separately below
          : content.badge;

        return (
          <div
            key={key}
            className={`glass-card p-8 relative${
              isHighlighted
                ? " border-2 border-primary md:scale-105"
                : ""
            }`}
          >
            {/* Badge row */}
            {(current || upgrade || badge) && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                {current && (
                  <span className="bg-chart-4 text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    CURRENT PLAN
                  </span>
                )}
                {!current && upgrade && (
                  <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <FiTrendingUp className="w-3 h-3" />
                    UPGRADE
                  </span>
                )}
                {!current && !upgrade && badge && (
                  <span
                    className={`${
                      isHighlighted ? "bg-primary" : "bg-chart-3"
                    } text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold`}
                  >
                    {badge}
                  </span>
                )}
              </div>
            )}

            {/* Name + description */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2">
                {content.name}
              </h3>
              <p className="text-muted-foreground text-sm">
                {content.description}
              </p>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-5xl font-bold text-foreground">
                  ${price}
                </span>
                <span className="text-muted-foreground ml-2">/month</span>
              </div>
            </div>

            {/* CTA */}
            <Button
              onClick={() => handleClick(key)}
              disabled={isLoading || current}
              className={`w-full mb-6 flex items-center justify-center ${
                upgrade
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
                  : isHighlighted
                  ? "btn-primary"
                  : "btn-secondary"
              }`}
            >
              {current
                ? "Current Plan"
                : upgrade
                ? "Upgrade Now"
                : isLoading
                ? "Loading…"
                : "Get Started"}
            </Button>

            {upgrade && (
              <p className="text-xs text-center text-green-400 -mt-4 mb-4">
                ⚡ Instant upgrade with prorated billing
              </p>
            )}

            {/* Feature list */}
            <ul className="space-y-3">
              {content.features.map((feature: string, i: number) => (
                <li key={i} className="flex items-start text-foreground">
                  <FiCheck className="text-primary mr-3 mt-1 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
