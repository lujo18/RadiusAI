"use client";
import React from "react";

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { FiZap, FiCheck, FiX, FiArrowRight, FiStar, FiTrendingUp } from 'react-icons/fi';
import { pricingContent } from '@/content/pricing';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import UpgradeFlow from '@/components/billing/UpgradeFlow';
import { PricingCards } from '@/components/billing/PricingCards';
import type { PlanKey } from '@/lib/plans';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string | null;
  quote: string;
  rating: number;
}

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [prices, setPrices] = useState<any>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSubscriptionAlert, setShowSubscriptionAlert] = useState(false);
  const [showUpgradeFlow, setShowUpgradeFlow] = useState(false);
  const [currentUserPlan, setCurrentUserPlan] = useState<string | null>(null);
  // Guard: prevent multiple plan fetches when user reference churns during auth hydration
  const planFetchedRef = useRef(false);

  // ---- Static / one-time effects (no user dependency) ----
  useEffect(() => {
    // Check if redirected due to subscription requirement
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reason') === 'subscription_required') {
      setShowSubscriptionAlert(true);
      window.history.replaceState({}, '', '/pricing');
    }

    // Fetch product + price info from backend billing service
    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
    fetch(`${apiBase}/api/billing/products`)
      .then(res => res.json())
      .then(data => {
        const map: Record<string, any> = {};
        (data.products || []).forEach((p: any) => {
          map[p.id] = { amount: p.prices?.[0]?.unit_amount || 0, productId: p.id };
        });
        setPrices(map);
      })
      .catch(console.error);

    // Fetch testimonials
    fetch('/api/testimonials')
      .then(res => res.json())
      .then(data => setTestimonials(data.testimonials || []))
      .catch(console.error);
  }, []);

  // ---- User-dependent: fetch current subscription plan from Supabase ----
  useEffect(() => {
    // Only fetch once per mount regardless of how many times user reference changes
    if (!user?.id || planFetchedRef.current) return;
    planFetchedRef.current = true;

    const fetchUserPlan = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Query the users table directly — no backend call needed
        const { data, error } = await supabase
          .from('users')
          .select('subscription_plan, subscription_status')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('[Pricing] Error fetching user plan:', error.message);
          return;
        }

        if (data?.subscription_plan) {
          setCurrentUserPlan(data.subscription_plan);
        }
      } catch (err) {
        console.error('[Pricing] Unexpected error fetching user plan:', err);
      }
    };

    fetchUserPlan();
  }, [user?.id]);

  const handleGetStarted = async (planName: 'starter' | 'growth' | 'unlimited') => {
    setIsLoading(true);
    
    try {
      console.log('[Pricing] Get Started clicked for plan:', planName);
      
      // ALWAYS check authentication with fresh server call
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      console.log('[Pricing] User check result:', { 
        hasUser: !!user, 
        userId: user?.id,
        error: userError?.message 
      });
      
      // If no valid user, ALWAYS go to signup first
      if (!user || userError) {
        console.log('[Pricing] No authenticated user - redirecting to SIGNUP');
        router.push(`/signup?plan=${planName}`);
        setIsLoading(false);
        return;
      }
      
      // User is authenticated - verify session validity
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('[Pricing] Session check result:', {
        hasSession: !!session,
        expiresAt: session?.expires_at,
        error: sessionError?.message
      });
      
      if (!session || sessionError) {
        console.log('[Pricing] No valid session - redirecting to SIGNUP');
        router.push(`/signup?plan=${planName}`);
        setIsLoading(false);
        return;
      }
      
      // Check if session is expired
      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
      const now = Date.now();
      
      if (expiresAt < now) {
        console.log('[Pricing] Session expired - redirecting to SIGNUP');
        await supabase.auth.signOut();
        router.push(`/signup?plan=${planName}`);
        setIsLoading(false);
        return;
      }
      
      // User is authenticated with valid session - proceed to checkout
      console.log('[Pricing] Valid authentication - proceeding to CHECKOUT');
      router.push(`/checkout?plan=${planName}`);
      
    } catch (error) {
      console.error('[Pricing] Error in handleGetStarted:', error);
      // On ANY error, redirect to signup for safety
      console.log('[Pricing] Error occurred - redirecting to SIGNUP');
      router.push(`/signup?plan=${planName}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriceForPlan = (plan: 'starter' | 'growth' | 'unlimited') => {
    if (!prices) return null;
    const priceData = prices[plan];
    if (!priceData) return null;

    const amount = priceData.amount || 0;
    const productId = priceData.productId;

    return {
      amount,
      productId,
      savings: 0
    };
  };

  const starterPrice = getPriceForPlan('starter');
  const growthPrice = getPriceForPlan('growth');
  const unlimitedPrice = getPriceForPlan('unlimited');

  // Define plan hierarchy for upgrade logic
  const planHierarchy = ['starter', 'growth', 'unlimited'];
  const getPlanLevel = (plan: string) => {
    const index = planHierarchy.findIndex(p => plan.toLowerCase().includes(p));
    return index === -1 ? -1 : index;
  };

  const isCurrentPlan = (planName: string) => {
    if (!currentUserPlan) return false;
    return currentUserPlan.toLowerCase().includes(planName.toLowerCase());
  };

  const isUpgrade = (planName: string) => {
    if (!currentUserPlan) return false;
    const currentLevel = getPlanLevel(currentUserPlan);
    const targetLevel = getPlanLevel(planName);
    return targetLevel > currentLevel;
  };

  const handleUpgrade = () => {
    setShowUpgradeFlow(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Structured data for pricing/offers to help LLMs and AI crawlers */}
      <Script id="pricing-ldjson" type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
            name: pricingContent.hero?.headline || 'SlideForge',
            description: pricingContent.hero?.subheadline || '',
          url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com') + '/pricing',
          offers: [
            {
              "@type": "Offer",
              name: pricingContent.plans.starter.name,
              price: 19,
              priceCurrency: 'USD'
            },
            {
              "@type": "Offer",
              name: pricingContent.plans.growth.name,
              price: 29,
              priceCurrency: 'USD'
            },
            {
              "@type": "Offer",
              name: pricingContent.plans.unlimited.name,
              price: 99,
              priceCurrency: 'USD'
            }
          ]
        })}
      </Script>

      {/* Answer-first quick summary (machine-focused, hidden visually) */}
      <section className="sr-only" aria-label="Pricing quick answer">
        <h1>Radius pricing — plans for solo founders with automated TikTok slideshow creation and CTA interval testing.</h1>
        <p>Plans start at $19/month. Growth plan includes A/B CTA interval testing and niche templates to improve engagement.</p>
      </section>
      {/* Subscription Required Alert */}
      {showSubscriptionAlert && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
          <div className="glass-card bg-chart-1/10 border-chart-1/30 p-4 rounded-lg shadow-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FiZap className="h-5 w-5 text-chart-1" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-chart-1">
                  Active Subscription Required
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  You need an active subscription to access the dashboard. Choose a plan below to get started!
                </p>
              </div>
              <Button
                onClick={() => setShowSubscriptionAlert(false)}
                className="ml-4 flex-shrink-0 text-muted-foreground hover:text-foreground"
              >
                <FiX className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-chart-4/10 border border-chart-4/20 text-chart-4 text-sm mb-6">
            {pricingContent.hero.badge}
          </div>

          <h2 className="text-5xl md:text-6xl font-bold font-main text-foreground mb-6">
            {pricingContent.hero.headline}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {pricingContent.hero.subheadline}
          </p>
        </div>
      </section>

      {/* PRICING CARDS */}
      <section className="pb-20 px-6">
        <PricingCards
          currentUserPlan={currentUserPlan}
          prices={prices}
          isLoading={isLoading}
          onGetStarted={(plan: PlanKey) => handleGetStarted(plan)}
          onUpgrade={handleUpgrade}
        />
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-16 px-6 bg-dark-500">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-center text-gray-400 text-sm font-semibold mb-8">
            {pricingContent.socialProof.headline}
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {pricingContent.socialProof.companies.map((company, i) => (
              <div
                key={i}
                className="w-16 h-16 rounded-full bg-muted border border flex items-center justify-center"
              >
                <span className="text-gray-500 text-xs font-bold">{company.charAt(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE COMPARISON TABLE */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold font-main text-foreground mb-4">
              {pricingContent.comparison.headline}
            </h2>
            <p className="text-xl text-muted-foreground">{pricingContent.comparison.subheadline}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border">
                  <th className="text-left py-4 px-4 text-muted-foreground font-semibold">Features</th>
                  <th className="text-center py-4 px-4">
                    <div className="text-foreground font-bold mb-1">Starter</div>
                    <div className="text-muted-foreground text-sm">$19/mo</div>
                  </th>
                  <th className="text-center py-4 px-4 bg-primary/10 rounded-t-lg">
                    <div className="text-foreground font-bold mb-1">Growth</div>
                    <div className="text-primary text-sm">${growthPrice?.amount?.toFixed(0) || '29'}/mo</div>
                  </th>
                  <th className="text-center py-4 px-4">
                    <div className="text-foreground font-bold mb-1">Unlimited</div>
                    <div className="text-muted-foreground text-sm">${unlimitedPrice?.amount?.toFixed(0) || '99'}/mo</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pricingContent.comparison.categories.map((category, catIndex) => (
                  <>
                    <tr key={`cat-${catIndex}`} className="border-b border">
                      <td colSpan={4} className="py-4 px-4 text-foreground font-bold text-lg">
                        {category.name}
                      </td>
                    </tr>
                    {category.features.map((feature, featIndex) => (
                      <tr key={`feat-${catIndex}-${featIndex}`} className="border-b border-gray-800/50">
                        <td className="py-3 px-4 text-gray-300">{feature.name}</td>
                        <td className="py-3 px-4 text-center">
                          {typeof feature.starter === 'boolean' ? (
                            feature.starter ? (
                              <FiCheck className="text-primary mx-auto" />
                            ) : (
                              <FiX className="text-gray-600 mx-auto" />
                            )
                          ) : (
                            <span className="text-gray-300">{feature.starter}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center bg-primary/10">
                          {typeof feature.starter === 'boolean' ? (
                            feature.starter ? (
                              <FiCheck className="text-primary mx-auto" />
                            ) : (
                              <FiX className="text-gray-600 mx-auto" />
                            )
                          ) : (
                            <span className="text-gray-300">{feature.starter}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {typeof feature.agency === 'boolean' ? (
                            feature.agency ? (
                              <FiCheck className="text-primary mx-auto" />
                            ) : (
                              <FiX className="text-gray-600 mx-auto" />
                            )
                          ) : (
                            <span className="text-gray-300">{feature.agency}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 px-6 bg-muted">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold font-main text-foreground text-center mb-4">
            Loved by people worldwide
          </h2>
          <p className="text-xl text-muted-foreground text-center mb-12">
            See what our customers are saying
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.slice(0, 3).map((testimonial) => (
              <div key={testimonial.id} className="glass-card p-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FiStar key={i} className="text-chart-1 fill-current" />
                  ))}
                </div>
                <p className="text-foreground mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-chart-5 flex items-center justify-center text-primary-foreground font-bold mr-3">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-foreground font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}{testimonial.company && ` · ${testimonial.company}`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold font-main text-foreground text-center mb-12">
            {pricingContent.faq.headline}
          </h2>

          <div className="space-y-4">
            {pricingContent.faq.items.map((item, i) => (
              <details key={i} className="glass-card p-6 cursor-pointer group">
                <summary className="text-xl font-semibold text-foreground flex items-center justify-between">
                  {item.question}
                  <FiArrowRight className="text-primary transform group-open:rotate-90 transition-transform" />
                </summary>
                <p className="text-muted-foreground mt-4 leading-relaxed">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 px-6 bg-muted">
        <div className="max-w-4xl mx-auto text-center glass-card p-12">
          <h2 className="text-4xl md:text-5xl font-bold font-main text-foreground mb-6">
            {pricingContent.cta.headline}
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            {pricingContent.cta.subheadline}
          </p>
          <Link href="/signup" className="btn-primary text-lg px-8 py-4 inline-flex items-center">
            {pricingContent.cta.ctaPrimary}
            <FiArrowRight className="ml-2" />
          </Link>
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground mt-6">
            {pricingContent.cta.features.map((feature, i) => (
              <span key={i}>{feature}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Upgrade Flow Modal */}
      <UpgradeFlow
        isOpen={showUpgradeFlow}
        onClose={() => setShowUpgradeFlow(false)}
        trigger="paywall"
      />
    </div>
  );
}
