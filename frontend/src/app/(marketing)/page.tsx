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
import { motion } from "motion/react";
import { PricingCards } from "@/components/billing/PricingCards";

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

      <section className="pt-20 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <Badge className="mb-12">{landingContent.hero.badge}</Badge>

          {/* Headline (visual) - promoted to H2 so hidden H1 remains the primary document title for machines */}
          <h2 className="text-5xl font-bold mb-8">
            {landingContent.hero.headline}
          </h2>

          {/* Subheadline */}
          <h3 className="text-2xl muted mb-12">
            {landingContent.hero.subheadline}
          </h3>

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
      <section
        id="benefits"
        className="py-20 px-6 relative overflow-hidden bg-background"
      >
        <BeamsBackground className="absolute inset-0 opacity-20" />
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold font-main text-foreground mb-4 tracking-tight">
              {landingContent.benefits.headline}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {landingContent.benefits.subheadline}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {landingContent.benefits.items.map((benefit, i) => {
              const IconComp = (LucideIcons as any)[benefit.icon];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative bg-card/50 backdrop-blur-xl border border-border overflow-hidden rounded-2xl p-8 hover:shadow-2xl hover:border-primary/50 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10">
                    <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      {IconComp ? (
                        <IconComp className="w-7 h-7 text-primary" />
                      ) : (
                        <div className="w-7 h-7 bg-muted-foreground/10 rounded-full" />
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                      {benefit.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==========================================
          HOW IT WORKS
          ========================================== */}
      <section className="py-24 px-6 relative border-t border-border/50">
        <DotPattern
          className={cn(
            "[mask-image:radial-gradient(700px_circle_at_center,white,transparent)] opacity-30",
          )}
        />
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold font-main text-foreground text-center mb-20 tracking-tight">
              {landingContent.howItWorks.headline}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent -z-10" />

            {landingContent.howItWorks.steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="text-center relative"
              >
                <div className="w-24 h-24 rounded-2xl bg-background border border-primary/20 shadow-lg shadow-primary/10 flex items-center justify-center text-4xl font-bold text-primary mx-auto mb-8 relative group">
                  <div className="absolute inset-0 bg-primary/10 rounded-2xl animate-ping opacity-20" />
                  <span className="bg-gradient-to-br from-primary to-primary/50 text-transparent bg-clip-text">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
          TESTIMONIALS
          ========================================== */}
      <section className="py-24 px-6 relative bg-card/30">
        <LightRays className="opacity-10" />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold font-main text-foreground mb-4 tracking-tight">
              {landingContent.testimonials.headline}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {landingContent.testimonials.subheadline}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.slice(0, 6).map((testimonial, i) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-background/80 backdrop-blur-md border border-border/50 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:border-primary/30 transition-all"
              >
                <div className="flex items-center mb-6">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <FiStar
                      key={j}
                      className="text-yellow-500 fill-yellow-500 w-5 h-5 mr-1"
                    />
                  ))}
                </div>
                <p className="text-foreground/90 mb-8 text-lg font-medium leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center mt-auto">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-primary-foreground font-bold text-xl mr-4 shadow-inner">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-foreground font-bold text-lg">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-primary/80 font-medium">
                      {testimonial.role}
                      {testimonial.company && (
                        <span className="text-muted-foreground font-normal">
                          {" "}
                          · {testimonial.company}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
          PRICING SECTION
          ========================================== */}
      <section
        id="pricing"
        className="py-24 px-6 bg-background relative border-y border-border/50"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold font-main text-foreground mb-6 tracking-tight">
              {landingContent.pricing.headline}
            </h2>
            <p className="text-xl text-muted-foreground">
              {landingContent.pricing.subheadline}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <PricingCards
              onGetStarted={(plan) => router.push(`/pricing?plan=${plan}`)}
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-center text-sm text-muted-foreground mt-10 font-medium"
          >
            {landingContent.pricing.ctaNote}
          </motion.p>
        </div>
      </section>

      {/* ==========================================
          FAQ SECTION
          ========================================== */}
      <section id="faq" className="py-24 px-6 bg-card/20">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
              {landingContent.faq.headline}
            </h2>
            <p className="text-xl text-muted-foreground">
              {landingContent.faq.subheadline}
            </p>
          </motion.div>

          <div className="space-y-4">
            {landingContent.faq.items.map((item, i) => (
              <motion.details
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group bg-background border border-border/50 rounded-2xl p-6 cursor-pointer hover:border-primary/50 transition-colors shadow-sm"
              >
                <summary className="text-lg font-bold text-foreground flex items-center justify-between list-none [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <div className="bg-primary/10 p-2 rounded-full text-primary group-open:rotate-45 transition-transform duration-300">
                    <LucideIcons.Plus className="w-5 h-5" />
                  </div>
                </summary>
                <div className="mt-6 text-muted-foreground leading-relaxed pl-2 border-l-2 border-primary/20">
                  {item.answer}
                </div>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
          FINAL CTA SECTION
          ========================================== */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/10" />
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-card/50 backdrop-blur-2xl border border-primary/20 rounded-[3rem] p-12 md:p-20 text-center shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/30 rounded-full blur-[100px]" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/20 rounded-full blur-[100px]" />

            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-bold font-main text-foreground mb-8 tracking-tight">
                {landingContent.cta.headline}
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
                {landingContent.cta.subheadline}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Button
                  type="button"
                  onClick={handleGetStarted}
                  disabled={isSigningIn}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xl px-12 py-8 rounded-2xl shadow-xl shadow-primary/25 transition-all hover:scale-105"
                >
                  {isSigningIn ? (
                    <span className="flex items-center gap-3">
                      <Spinner className="w-5 h-5" /> Signing in...
                    </span>
                  ) : (
                    <>
                      <FaGoogle className="mr-3 w-6 h-6" />
                      {landingContent.cta.ctaPrimary}
                    </>
                  )}
                </Button>
                {landingContent.cta.ctaSecondary && (
                  <Button
                    type="button"
                    variant="outline"
                    className="text-xl px-12 py-8 rounded-2xl border-2 hover:bg-secondary/50 transition-all hover:scale-105"
                  >
                    {landingContent.cta.ctaSecondary}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
