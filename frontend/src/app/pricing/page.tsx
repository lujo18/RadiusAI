"use client";
import React from "react";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { FiZap, FiCheck, FiX, FiArrowRight, FiStar } from 'react-icons/fi';
import { pricingContent } from '@/content/pricing';
import { supabase } from '@/lib/supabase/client';
import PublicNavbar from '@/components/PublicNavbar';

interface PriceData {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: {
    interval: 'month' | 'year';
  };
}

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
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [prices, setPrices] = useState<any>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSubscriptionAlert, setShowSubscriptionAlert] = useState(false);

  useEffect(() => {
    // Check if redirected due to subscription requirement
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reason') === 'subscription_required') {
      setShowSubscriptionAlert(true);
      // Remove the query param from URL after reading
      window.history.replaceState({}, '', '/pricing');
    }

    // Fetch Stripe prices
    fetch('/api/stripe/prices')
      .then(res => res.json())
      .then(data => setPrices(data.plans))
      .catch(console.error);

    // Fetch testimonials
    fetch('/api/testimonials')
      .then(res => res.json())
      .then(data => setTestimonials(data.testimonials || []))
      .catch(console.error);
  }, []);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <PublicNavbar />

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

          <h1 className="text-5xl md:text-6xl font-bold font-main text-foreground mb-6">
            {pricingContent.hero.headline}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {pricingContent.hero.subheadline}
          </p>
        </div>
      </section>

      {/* BILLING TOGGLE */}
      <div className="flex items-center justify-center mb-12 px-6">
        <div className="glass-card p-2 inline-flex items-center space-x-4">
          <Button
            onClick={() => setBillingInterval('month')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              billingInterval === 'month'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly
          </Button>
          <Button
            onClick={() => setBillingInterval('year')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              billingInterval === 'year'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Yearly
            <span className="ml-2 text-xs bg-chart-4/20 text-chart-4 px-2 py-1 rounded">
              Save 30%
            </span>
          </Button>
        </div>
      </div>

      {/* PRICING CARDS */}
      <section className="pb-20 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          {/* STARTER PLAN */}
          <div className="glass-card p-8 relative">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2">{pricingContent.plans.starter.name}</h3>
              <p className="text-muted-foreground text-sm">{pricingContent.plans.starter.description}</p>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-5xl font-bold text-foreground">$19</span>
                <span className="text-muted-foreground ml-2">/month</span>
              </div>
            </div>

            <Button
              onClick={() => handleGetStarted('starter')}
              disabled={isLoading}
              className="btn-secondary w-full mb-6 flex items-center justify-center"
            >
              {isLoading ? 'Loading...' : 'Get Started'}
            </Button>

            <ul className="space-y-3">
              {pricingContent.plans.starter.features.map((feature, i) => (
                <li key={i} className="flex items-start text-foreground">
                  <FiCheck className="text-primary mr-3 mt-1 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* GROWTH PLAN (POPULAR) */}
          <div className="glass-card p-8 relative border-2 border-primary transform md:scale-105">
            {pricingContent.plans.growth.badge && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                  {pricingContent.plans.growth.badge}
                </span>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2">{pricingContent.plans.growth.name}</h3>
              <p className="text-muted-foreground text-sm">{pricingContent.plans.growth.description}</p>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-5xl font-bold text-foreground">
                  ${growthPrice?.amount?.toFixed(0) || '29'}
                </span>
                <span className="text-muted-foreground ml-2">/month</span>
              </div>
            </div>

            <Button
              onClick={() => handleGetStarted('growth')}
              disabled={isLoading}
              className="btn-primary w-full mb-6 flex items-center justify-center"
            >
              {isLoading ? 'Loading...' : 'Get Started'}
            </Button>

            <ul className="space-y-3">
              {pricingContent.plans.growth.features.map((feature, i) => (
                <li key={i} className="flex items-start text-foreground">
                  <FiCheck className="text-primary mr-3 mt-1 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* UNLIMITED PLAN */}
          <div className="glass-card p-8 relative">
            {pricingContent.plans.unlimited.badge && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-chart-3 text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                  {pricingContent.plans.unlimited.badge}
                </span>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2">{pricingContent.plans.unlimited.name}</h3>
              <p className="text-muted-foreground text-sm">{pricingContent.plans.unlimited.description}</p>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-5xl font-bold text-foreground">
                  ${unlimitedPrice?.amount?.toFixed(0) || '99'}
                </span>
                <span className="text-muted-foreground ml-2">/month</span>
              </div>
            </div>

            <Button
              onClick={() => handleGetStarted('unlimited')}
              disabled={isLoading}
              className="btn-secondary w-full mb-6 flex items-center justify-center"
            >
              {isLoading ? 'Loading...' : 'Get Started'}
            </Button>

            <ul className="space-y-3">
              {pricingContent.plans.unlimited.features.map((feature, i) => (
                <li key={i} className="flex items-start text-foreground">
                  <FiCheck className="text-primary mr-3 mt-1 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
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

      {/* FOOTER */}
      <footer className="bg-background border-t border py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Link href="/" className="flex items-center space-x-2 mb-4">
                <FiZap className="text-primary text-2xl" />
                <span className="text-xl font-bold text-foreground">ViralStack</span>
              </Link>
              <p className="text-muted-foreground text-sm">AI-powered carousel automation for modern creators</p>
            </div>

            <div>
              <h3 className="text-foreground font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="/#benefits" className="text-muted-foreground hover:text-foreground text-sm transition">Features</Link></li>
                <li><Link href="/pricing" className="text-muted-foreground hover:text-foreground text-sm transition">Pricing</Link></li>
                <li><Link href="/#faq" className="text-muted-foreground hover:text-foreground text-sm transition">FAQ</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-foreground font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-muted-foreground hover:text-foreground text-sm transition">About</Link></li>
                <li><Link href="/contact" className="text-muted-foreground hover:text-foreground text-sm transition">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-foreground font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground text-sm transition">Privacy</Link></li>
                <li><Link href="/terms" className="text-muted-foreground hover:text-foreground text-sm transition">Terms</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border pt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} ViralStack. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
