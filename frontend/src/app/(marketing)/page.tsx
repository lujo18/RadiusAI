"use client";

import React from "react";
import { useEffect, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiCheck, FiArrowRight, FiPlay, FiStar } from "react-icons/fi";
import { FaGoogle } from "react-icons/fa";
import * as LucideIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { landingContent, DynamicMetrics } from "@/content/landing";
import BeamsBackground from "@/components/kokonutui/beams-background";
import { useAuth } from "@/lib/api/hooks/useAuth";
import { useUserTeams } from "@/lib/api/hooks/useTeams";
import { Spinner } from "@/components/ui/spinner";
import { signInWithGoogle } from "@/lib/supabase/auth";
import { Badge } from "@/components/ui/badge";
import { HeroVideoDialog } from "@/components/ui/hero-video-dialog";
import { LightRays } from "@/components/ui/light-rays";
import { DotPattern } from "@/components/ui/dot-pattern";
import { cn } from "@/lib/utils";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string | null;
  quote: string;
  avatar_url: string | null;
  rating: number;
}

export default function LandingPage() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useAuth({ requireAuth: false });
  const {
    data: teams,
    isLoading: teamsLoading,
    error: teamsError,
  } = useUserTeams();
  const [metrics, setMetrics] = useState<DynamicMetrics | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGetStarted = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("[Landing] Get Started clicked - initiating Google signin");
    setIsSigningIn(true);
    try {
      console.log("[Landing] Calling signInWithGoogle...");
      await signInWithGoogle();
      // Google signin will redirect to /auth/callback
      console.log("[Landing] Google signin initiated");
    } catch (error) {
      console.error("[Landing] Google signin error:", error);
      setIsSigningIn(false);
    }
  };

  // Debug logging
  useEffect(() => {
    console.log("[Landing] Auth state:", {
      user: user?.id,
      userLoading,
      teamsCount: teams?.length,
      teamsLoading,
      teamsError: teamsError?.message,
      redirectAttempted,
    });
  }, [user, userLoading, teams, teamsLoading, teamsError, redirectAttempted]);

  // Redirect authenticated users to their first team (with guard against infinite loops)
  useEffect(() => {
    // Only attempt redirect once per page load
    if (redirectAttempted) {
      console.log("[Landing] Already attempted redirect, skipping");
      return;
    }

    // Don't redirect if still loading
    if (userLoading || (user && teamsLoading)) {
      console.log("[Landing] Still loading auth or teams");
      return;
    }

    // If no user, don't redirect
    if (!user) {
      console.log("[Landing] No authenticated user");
      return;
    }

    // If user but teams loading failed, show error
    if (teamsError) {
      console.error("[Landing] Teams query error:", teamsError);
      return;
    }

    // If user has no teams, don't redirect
    if (!teams || teams.length === 0) {
      console.log("[Landing] User authenticated but has no teams");
      return;
    }

    // Ready to redirect!
    console.log("[Landing] Redirecting user to first team:", teams[0].id);
    setRedirectAttempted(true);

    // Use replace instead of push to prevent back button, and use setTimeout to ensure state updates
    setTimeout(() => {
      router.replace(`/${teams[0].id}/overview`);
    }, 0);
  }, [
    user,
    teams,
    userLoading,
    teamsLoading,
    teamsError,
    redirectAttempted,
    router,
  ]);

  // Fetch dynamic metrics and testimonials
  useEffect(() => {
    fetch("/api/metrics")
      .then((res) => res.json())
      .then((data) => setMetrics(data))
      .catch(console.error);

    fetch("/api/testimonials")
      .then((res) => res.json())
      .then((data) => setTestimonials(data.testimonials || []))
      .catch(console.error);
  }, []);

  // Render loading state while checking auth
  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Spinner className="size-8" />
          <p className="mt-2 text-sm text-foreground/60">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  // Render loading state while loading teams
  if (user && teamsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Spinner className="size-8" />
          <p className="mt-2 text-sm text-foreground/60">
            Loading your teams...
          </p>
        </div>
      </div>
    );
  }

  // Render error state if teams query failed
  if (user && teamsError) {
    console.error("Failed to load teams:", teamsError);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Oops!</h1>
          <p className="text-foreground/60 mb-6">Failed to load your teams.</p>
          <p className="text-sm text-foreground/40 mb-6 font-mono">
            {String(teamsError)}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-background rounded-lg hover:bg-primary/80 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* JSON-LD for AI crawlers + structured claims */}
      <Script id="marketing-ldjson" type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: landingContent.hero?.headline || "Radius",
          url: process.env.NEXT_PUBLIC_SITE_URL || "https://example.com",
          description: landingContent.hero?.subheadline || "",
          potentialAction: {
            "@type": "SearchAction",
            target: `${process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"}/?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        })}
      </Script>
      {/* FAQ structured data (helps AI extract Q&A) */}
      <Script id="marketing-faq-ldjson" type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: (landingContent.faq?.items || []).map((it: any) => ({
            "@type": "Question",
            name: it.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: it.answer,
            },
          })),
        })}
      </Script>

      {/* Answer-first short claim to help LLMs and visual search parse intent */}
      <section
        aria-hidden={false}
        className="sr-only"
        aria-label="Quick answer"
      >
        <h1>
          Radius: TikTok slideshow automation for solo founders — automates
          carousel creation, niche templates, and CTA interval testing.
        </h1>
        <p>
          Automating TikTok slideshows results in an average engagement rate of
          7.5% for accounts with fewer than 100,000 followers and enables fast,
          testable CTAs for higher conversions.
        </p>
      </section>
      {/* ==========================================
          HERO SECTION
          ========================================== */}

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <Badge className="mb-12">{landingContent.hero.badge}</Badge>

          {/* Headline (visual) - promoted to H2 so hidden H1 remains the primary document title for machines */}
          <h1 className="text-5xl mb-8">{landingContent.hero.headline}</h1>

          {/* Subheadline */}
          <h2 className="text-2xl muted mb-12">
            {landingContent.hero.subheadline}
          </h2>

          {/* CTAs */}
          <div className="mb-8">
            <div className="mb-8">
              <Button
                type="button"
                onClick={handleGetStarted}
                disabled={isSigningIn}
                className="btn-primary text-lg px-8 py-4"
              >
                {isSigningIn ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <FaGoogle className="mr-2" />
                    {landingContent.hero.ctaPrimary}
                  </>
                )}
              </Button>
            </div>
            {/* Features */}
            <div className="flex flex-wrap items-center justify-center gap-6 mb-8 muted">
              {landingContent.hero.features.map((feature, i) => (
                <span key={i}>{feature}</span>
              ))}
            </div>
          </div>

          {/* Product Screenshot/Video Placeholder */}
          <div className="relative">
            <HeroVideoDialog
              className="block dark:hidden"
              animationStyle="top-in-bottom-out"
              videoSrc="https://www.youtube.com/embed/qh3NGpYRG3I?si=4rb-zSdDkVK9qxxb"
              thumbnailSrc="https://startup-template-sage.vercel.app/hero-light.png"
              thumbnailAlt="Hero Video"
            />
            <HeroVideoDialog
              className="hidden dark:block"
              animationStyle="top-in-bottom-out"
              videoSrc="https://www.youtube.com/embed/qh3NGpYRG3I?si=4rb-zSdDkVK9qxxb"
              thumbnailSrc="https://startup-template-sage.vercel.app/hero-dark.png"
              thumbnailAlt="Hero Video"
            />
          </div>

          {/* Dynamic Metrics */}
          {metrics && (
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground mb-2">
                  {metrics.totalUsers.toLocaleString()}+
                </div>
                <div className="text-muted-foreground">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground mb-2">
                  {metrics.postsGenerated.toLocaleString()}+
                </div>
                <div className="text-muted-foreground">Posts Generated</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground mb-2">
                  {metrics.templatesAvailable}+
                </div>
                <div className="text-muted-foreground">Templates</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {metrics.avgEngagementIncrease}
                </div>
                <div className="text-muted-foreground">Avg. Engagement ↑</div>
              </div>
            </div>
          )}
        </div>
        <LightRays />
        <DotPattern
          glow={true}
          className={cn(
            "[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]",
          )}
        />
      </section>

      {/* ==========================================
          BENEFITS SECTION
          ========================================== */}
      <section id="benefits" className="py-20 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-main text-foreground mb-4">
              {landingContent.benefits.headline}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {landingContent.benefits.subheadline}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {landingContent.benefits.items.map((benefit, i) => {
              const IconComp = (LucideIcons as any)[benefit.icon];
              return (
                <div
                  key={i}
                  className="glass-card p-8 hover:scale-105 transition-transform"
                >
                  <div className="text-5xl mb-4">
                    {IconComp ? (
                      <IconComp className="w-12 h-12 text-primary" />
                    ) : (
                      <div className="w-12 h-12 bg-muted-foreground/10 rounded-full" />
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==========================================
          HOW IT WORKS
          ========================================== */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold font-main text-foreground text-center mb-16">
            {landingContent.howItWorks.headline}
          </h2>

          <div className="grid md:grid-cols-3 gap-12">
            {landingContent.howItWorks.steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-2xl font-bold text-primary mx-auto mb-6">
                  {step.number}
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
          PRICING SECTION
          ========================================== */}
      <section id="pricing" className="py-20 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-main text-foreground mb-4">
              {landingContent.pricing.headline}
            </h2>
            <p className="text-xl text-muted-foreground">
              {landingContent.pricing.subheadline}
            </p>
          </div>

          {/* Pricing cards - Import your existing Paywall component */}
          <div className="text-center">
            <Link
              href="/pricing"
              className="btn-primary text-lg px-8 py-4 inline-flex items-center"
            >
              View All Plans
              <FiArrowRight className="ml-2" />
            </Link>
            <p className="text-sm text-muted-foreground mt-4">
              {landingContent.pricing.ctaNote}
            </p>
          </div>
        </div>
      </section>

      {/* ==========================================
          TESTIMONIALS
          ========================================== */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-main text-foreground mb-4">
              {landingContent.testimonials.headline}
            </h2>
            <p className="text-xl text-muted-foreground">
              {landingContent.testimonials.subheadline}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.slice(0, 6).map((testimonial) => (
              <div key={testimonial.id} className="glass-card p-6">
                {/* Rating */}
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FiStar key={i} className="text-chart-1 fill-current" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-foreground/80 mb-6 italic">
                  "{testimonial.quote}"
                </p>

                {/* Author */}
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold mr-3">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-foreground font-semibold">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                      {testimonial.company && ` · ${testimonial.company}`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
          FAQ SECTION
          ========================================== */}
      <section id="faq" className="py-20 px-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground text-center mb-4">
            {landingContent.faq.headline}
          </h2>
          <p className="text-xl text-muted-foreground text-center mb-16">
            {landingContent.faq.subheadline}
          </p>

          <div className="space-y-4">
            {landingContent.faq.items.map((item, i) => (
              <details key={i} className="glass-card p-6 cursor-pointer group">
                <summary className="text-xl font-semibold text-foreground flex items-center justify-between">
                  {item.question}
                  <FiArrowRight className="text-primary transform group-open:rotate-90 transition-transform" />
                </summary>
                <p className="text-muted-foreground mt-4 leading-relaxed">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
          FINAL CTA SECTION
          ========================================== */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center glass-card p-12">
          <h2 className="text-4xl md:text-5xl font-bold font-main text-foreground mb-6">
            {landingContent.cta.headline}
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            {landingContent.cta.subheadline}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              type="button"
              onClick={handleGetStarted}
              disabled={isSigningIn}
              className="btn-primary text-lg px-8 py-4"
            >
              {isSigningIn ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <FaGoogle className="mr-2" />
                  {landingContent.cta.ctaPrimary}
                </>
              )}
            </Button>
            <Button type="button" className="btn-secondary text-lg px-8 py-4">
              {landingContent.cta.ctaSecondary}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
