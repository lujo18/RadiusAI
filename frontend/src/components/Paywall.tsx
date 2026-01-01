import React from "react";
/**
 * Stripe Paywall Component
 * 
 * Displays pricing tiers and handles subscription checkout
 * Prices are fetched directly from Stripe API
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Check, Zap, Sparkles, Building2 } from 'lucide-react';

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
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [pricesLoading, setPricesLoading] = useState(true);

  // Fetch prices from Stripe on mount
  useEffect(() => {
    async function fetchPrices() {
      try {
        const response = await fetch('/api/stripe/prices');
        const data = await response.json();

        // Merge Stripe prices with tier config
        const tiers: PricingTier[] = TIER_CONFIG.map((config) => {
          const stripePlan = data.plans[config.id];
          return {
            ...config,
            price: stripePlan?.amount || 0,
            priceId: stripePlan?.id || '',
          };
        });

        setPricingTiers(tiers);
      } catch (error) {
        console.error('Error fetching prices:', error);
        // Fallback to default prices if API fails
        setPricingTiers([
          { ...TIER_CONFIG[0], price: 29, priceId: '' },
          { ...TIER_CONFIG[1], price: 99, priceId: '' },
        ]);
      } finally {
        setPricesLoading(false);
      }
    }

    fetchPrices();
  }, []);

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
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId: currentUser.id,
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
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
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
        <div className="text-white text-xl">Loading pricing...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-300">
            Scale your social media content creation
          </p>
        </div>

        {/* Current Plan Badge */}
        {user && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white">
              <span className="text-white/70">Current Plan:</span>
              <span className="font-bold capitalize">{user.plan}</span>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {pricingTiers.map((tier) => {
            const isCurrentPlan = user?.plan === tier.id;

            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl p-8 ${
                  tier.popular
                    ? 'bg-gradient-to-br from-purple-600 to-pink-600 transform scale-105'
                    : 'bg-white/10 backdrop-blur-lg'
                } ${isCurrentPlan ? 'ring-4 ring-green-500' : ''}`}
              >
                {/* Popular Badge */}
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-yellow-400 text-gray-900 text-sm font-bold rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-green-500 text-white text-sm font-bold rounded-full">
                      CURRENT PLAN
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-lg mb-4">
                  {tier.icon}
                </div>

                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-white mb-2">
                  {tier.name}
                </h3>

                {/* Description */}
                <p className="text-gray-300 mb-6">{tier.description}</p>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-5xl font-bold text-white">
                    ${tier.price}
                  </span>
                  {tier.price > 0 && (
                    <span className="text-gray-300 ml-2">/month</span>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() =>
                    isCurrentPlan && tier.price > 0
                      ? handleManageSubscription()
                      : handleSubscribe(tier.priceId, tier.id)
                  }
                  disabled={loading !== null}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                    tier.popular
                      ? 'bg-white text-purple-600 hover:bg-gray-100'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading === tier.id
                    ? 'Loading...'
                    : isCurrentPlan
                    ? 'Manage Subscription'
                    : 'Subscribe Now'}
                </button>

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
            <a href="mailto:support@viralstack.app" className="text-purple-400 hover:underline">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
