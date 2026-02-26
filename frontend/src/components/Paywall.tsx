import React from "react";
/**
 * Stripe Paywall Component
 * 
 * Displays pricing tiers and handles subscription checkout
 * Prices are fetched directly from Stripe API
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { Check, Zap, Sparkles, Building2, TrendingUp } from 'lucide-react';
import UpgradeFlow from '@/components/billing/UpgradeFlow';
import UsageBanner from '@/components/billing/UsageBanner';

interface PricingTier {
  id: 'starter' | 'pro' | 'agency';
  name: string;
  price: number;
  priceId: string; // Stripe Price ID
  description: string;
  icon: React.ReactNode;
  features: string[];
  limits: {
    templates: number | 'unlimited';
    posts: number | 'unlimited';
    profiles: number | 'unlimited';
    aiGenerations: number | 'unlimited';
  };
  popular?: boolean;
}

// Base tier configuration (features and limits)
const TIER_CONFIG: Omit<PricingTier, 'price' | 'priceId'>[] = [
  {
    id: 'pro',
    name: 'Pro',
    description: 'For serious content creators',
    icon: <Sparkles className="w-6 h-6" />,
    features: [
      'Unlimited templates',
      'Unlimited posts',
      '5 brand profiles',
      'Advanced analytics',
      'Schedule posts',
      'Priority support',
      'Custom branding',
    ],
    limits: {
      templates: 'unlimited',
      posts: 'unlimited',
      profiles: 5,
      aiGenerations: 'unlimited',
    },
    popular: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    description: 'For agencies managing multiple brands',
    icon: <Building2 className="w-6 h-6" />,
    features: [
      'Everything in Pro',
      'Unlimited brand profiles',
      'Team collaboration',
      'White-label options',
      'API access',
      'Dedicated support',
      'Custom integrations',
    ],
    limits: {
      templates: 'unlimited',
      posts: 'unlimited',
      profiles: 'unlimited',
      aiGenerations: 'unlimited',
    },
  },
];

export default function Paywall() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [showUpgradeFlow, setShowUpgradeFlow] = useState(false);

  // Use TanStack Query hook to fetch Stripe products (with joined price info)
  const { useStripeProducts } = require('@/features/stripe/hooksProducts');
  const { data: products, isLoading: pricesLoading } = useStripeProducts();
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);

  // Map products to pricing tiers when products change
  useEffect(() => {
    if (!products) return;
    // Find products for Pro and Agency tiers
    // Assume each product has: id, name, description, default_price, price (joined), etc.
    // See types/stripe for field names
    const tiers: PricingTier[] = TIER_CONFIG.map((config) => {
      // Find product by name or id (case-insensitive)
      const product = products.find((p: any) => {
        // Prefer id match, fallback to name
        return (
          p.id === config.id ||
          (p.name && p.name.toLowerCase().includes(config.name.toLowerCase()))
        );
      });
      // Price info from joined price
      const priceObj = product?.price || product?.default_price_obj || {};
      return {
        ...config,
        price: priceObj.unit_amount ? priceObj.unit_amount / 100 : 0,
        priceId: priceObj.id || '',
      };
    });
    setPricingTiers(tiers);
  }, [products]);

  const handleSubscribe = async (priceId: string, plan: string) => {
    // Always verify authentication with Supabase before proceeding
    const { supabase } = await import('@/lib/supabase/client');
    const { data: { user: currentUser }, error } = await supabase.auth.getUser();
    
    if (!currentUser || error) {
      // No authenticated user - redirect to signup with plan parameter
      window.location.href = `/signup?plan=${plan}`;
      return;
    }

    setLoading(plan);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiBase}/api/billing/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: priceId,
          user_id: currentUser.id,
          plan,
        }),
      });

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoading('manage');

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiBase}/api/billing/portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user?.id,
        }),
      });

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error accessing customer portal:', error);
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  if (pricesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-foreground text-xl">Loading pricing...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground">
            Scale your social media content creation
          </p>
        </div>

        {/* Usage Banner - Shows when limits are close or reached */}
        {user && (
          <div className="mb-8">
            <UsageBanner />
          </div>
        )}

        {/* Current Plan Badge */}
        {user && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-foreground">
              <span className="text-foreground/70">Current Plan:</span>
              <span className="font-bold capitalize">{user.plan}</span>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {pricingTiers.map((tier) => {
            const isCurrentPlan = user?.plan === tier.id;
            const currentTierPrice = pricingTiers.find(t => t.id === user?.plan)?.price || 0;
            const isUpgrade = tier.price > currentTierPrice;
            const isDowngrade = tier.price < currentTierPrice;

          

            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl p-8 ${
                  tier.popular
                    ? 'bg-gradient-to-br from-purple-600 to-pink-600 transform scale-105'
                    : 'bg-card/10 backdrop-blur-lg'
                } ${isCurrentPlan ? 'ring-4 ring-green-500' : ''}`}
              >
                {/* Popular Badge */}
                {tier.popular && !isCurrentPlan && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-chart-1 text-primary-foreground text-sm font-bold rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-chart-4 text-primary-foreground text-sm font-bold rounded-full">
                      CURRENT PLAN
                    </span>
                  </div>
                )}

                {/* Upgrade Badge */}
                {isUpgrade && user && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold rounded-full flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      UPGRADE
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div className="flex items-center justify-center w-12 h-12 bg-primary/20 rounded-lg mb-4">
                  {tier.icon}
                </div>

                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {tier.name}
                </h3>

                {/* Description */}
                <p className="text-muted-foreground mb-6">{tier.description}</p>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-5xl font-bold text-foreground">
                    ${tier.price}
                  </span>
                  {tier.price > 0 && (
                    <span className="text-muted-foreground ml-2">/month</span>
                  )}
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => {
                    if (isCurrentPlan && tier.price > 0) {
                      handleManageSubscription();
                    } else if (isUpgrade && user) {
                      setShowUpgradeFlow(true);
                    } else {
                      handleSubscribe(tier.priceId, tier.id);
                    }
                  }}
                  disabled={loading !== null || (isDowngrade && !!user)}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                    isUpgrade && user
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                      : tier.popular
                      ? 'bg-primary text-primary-foreground hover:bg-primary/80'
                      : 'bg-card/20 text-foreground hover:bg-card/30'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading === tier.id
                    ? 'Loading...'
                    : isCurrentPlan
                    ? 'Manage Subscription'
                    : isUpgrade && user
                    ? 'Upgrade Now'
                    : isDowngrade && user
                    ? 'Contact Support for Downgrade'
                    : 'Subscribe Now'}
                </Button>

                {/* Upgrade Note */}
                {isUpgrade && user && (
                  <p className="mt-2 text-xs text-center text-green-400">
                    ⚡ Instant upgrade with prorated billing
                  </p>
                )}

                {/* Features List */}
                <ul className="mt-8 space-y-3">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-200">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* FAQ or Additional Info */}
        <div className="text-center text-gray-300">
          <p className="mb-4">
            All plans include access to our template library and AI-powered content generation.
          </p>
          <p className="text-sm">
            Need a custom plan?{' '}
            <a href="mailto:support@Radius.app" className="text-purple-400 hover:underline">
              Contact us
            </a>
          </p>
        </div>
      </div>

      {/* Upgrade Flow Modal */}
      <UpgradeFlow
        isOpen={showUpgradeFlow}
        onClose={() => setShowUpgradeFlow(false)}
        trigger="paywall"
      />
    </div>
  );
}
