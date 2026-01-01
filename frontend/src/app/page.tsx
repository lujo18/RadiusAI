
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiCheck, FiArrowRight, FiPlay, FiStar } from 'react-icons/fi';
import Image from 'next/image';
import { landingContent, DynamicMetrics } from '@/content/landing';
import PublicNavbar from '@/components/PublicNavbar';

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
'use client';

import React from "react";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiCheck, FiArrowRight, FiPlay, FiStar } from 'react-icons/fi';
import Image from 'next/image';
import { landingContent, DynamicMetrics } from '@/content/landing';
import PublicNavbar from '@/components/PublicNavbar';

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
  const [metrics, setMetrics] = useState<DynamicMetrics | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    // Fetch dynamic metrics
    fetch('/api/metrics')
      .then(res => res.json())
      .then(data => setMetrics(data))
      .catch(console.error);

    // Fetch testimonials
    fetch('/api/testimonials')
      .then(res => res.json())
      .then(data => setTestimonials(data.testimonials || []))
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-dark-600">
      {/* Navbar */}
      <PublicNavbar />

      {/* ==========================================
          HERO SECTION
          ========================================== */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm mb-8">
            {landingContent.hero.badge}
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-main font-extrabold text-white mb-6 leading-tight">
            {landingContent.hero.headline}
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-3xl mx-auto">
            {landingContent.hero.subheadline}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link href="/signup" className="btn-primary text-lg px-8 py-4">
              {landingContent.hero.ctaPrimary}
              <FiArrowRight className="ml-2" />
            </Link>
            <button className="btn-secondary text-lg px-8 py-4">
              <FiPlay className="mr-2" />
              {landingContent.hero.ctaSecondary}
            </button>
          </div>

          {/* Features */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            {landingContent.hero.features.map((feature, i) => (
              <span key={i}>{feature}</span>
            ))}
          </div>

          {/* Product Screenshot/Video Placeholder */}
          <div className="mt-16 glass-card p-4 max-w-5xl mx-auto">
            <div className="aspect-video bg-dark-500 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <FiPlay className="text-6xl text-primary-500 mx-auto mb-4" />
                <p className="text-gray-400">Product Demo Video</p>
              </div>
            </div>
          </div>

          {/* Dynamic Metrics */}
          {metrics && (
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">{metrics.totalUsers.toLocaleString()}+</div>
                <div className="text-gray-400">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">{metrics.postsGenerated.toLocaleString()}+</div>
                <div className="text-gray-400">Posts Generated</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">{metrics.templatesAvailable}+</div>
                <div className="text-gray-400">Templates</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-500 mb-2">{metrics.avgEngagementIncrease}</div>
                <div className="text-gray-400">Avg. Engagement ↑</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ==========================================
          BENEFITS SECTION
          ========================================== */}
      <section id="benefits" className="py-20 px-6 bg-dark-500">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-main text-white mb-4">
              {landingContent.benefits.headline}
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              {landingContent.benefits.subheadline}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {landingContent.benefits.items.map((benefit, i) => (
              <div key={i} className="glass-card p-8 hover:scale-105 transition-transform">
                <div className="text-5xl mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">{benefit.title}</h3>
                <p className="text-gray-400">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
          HOW IT WORKS
          ========================================== */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold font-main text-white text-center mb-16">
            {landingContent.howItWorks.headline}
          </h2>

          <div className="grid md:grid-cols-3 gap-12">
            {landingContent.howItWorks.steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary-500/20 border-2 border-primary-500 flex items-center justify-center text-2xl font-bold text-primary-500 mx-auto mb-6">
                  {step.number}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
          PRICING SECTION
          ========================================== */}
      <section id="pricing" className="py-20 px-6 bg-dark-500">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-main text-white mb-4">
              {landingContent.pricing.headline}
            </h2>
            <p className="text-xl text-gray-400">{landingContent.pricing.subheadline}</p>
          </div>

          {/* Pricing cards - Import your existing Paywall component */}
          <div className="text-center">
            <Link href="/pricing" className="btn-primary text-lg px-8 py-4 inline-flex items-center">
              View All Plans
              <FiArrowRight className="ml-2" />
            </Link>
            <p className="text-sm text-gray-400 mt-4">{landingContent.pricing.ctaNote}</p>
          </div>
        </div>
      </section>

      {/* ==========================================
          TESTIMONIALS
          ========================================== */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-main text-white mb-4">
              {landingContent.testimonials.headline}
            </h2>
            <p className="text-xl text-gray-400">{landingContent.testimonials.subheadline}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.slice(0, 6).map((testimonial) => (
              <div key={testimonial.id} className="glass-card p-6">
                {/* Rating */}
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FiStar key={i} className="text-yellow-500 fill-current" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-gray-300 mb-6 italic">"{testimonial.quote}"</p>

                {/* Author */}
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-pink-500 flex items-center justify-center text-white font-bold mr-3">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-400">
                      {testimonial.role}{testimonial.company && ` · ${testimonial.company}`}
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
      <section id="faq" className="py-20 px-6 bg-dark-500">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
            {landingContent.faq.headline}
          </h2>
          <p className="text-xl text-gray-400 text-center mb-16">
            {landingContent.faq.subheadline}
          </p>

          <div className="space-y-4">
            {landingContent.faq.items.map((item, i) => (
              <details key={i} className="glass-card p-6 cursor-pointer group">
                <summary className="text-xl font-semibold text-white flex items-center justify-between">
                  {item.question}
                  <FiArrowRight className="text-primary-500 transform group-open:rotate-90 transition-transform" />
                </summary>
                <p className="text-gray-400 mt-4 leading-relaxed">{item.answer}</p>
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
          <h2 className="text-4xl md:text-5xl font-bold font-main text-white mb-6">
            {landingContent.cta.headline}
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            {landingContent.cta.subheadline}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="btn-primary text-lg px-8 py-4">
              {landingContent.cta.ctaPrimary}
              <FiArrowRight className="ml-2" />
            </Link>
            <button className="btn-secondary text-lg px-8 py-4">
              {landingContent.cta.ctaSecondary}
            </button>
          </div>
        </div>
      </section>

      {/* ==========================================
          FOOTER
          ========================================== */}
      <footer className="bg-dark-500 border-t border-gray-800 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Logo + Tagline */}
            <div>
              <Link href="/" className="flex items-center space-x-2 mb-4">
                <Image src="/images/icon-primary.png" alt="Radius Logo" width={28} height={28} />
                <span className="text-xl font-bold text-white">Radius</span>
              </Link>
              <p className="text-gray-400 text-sm">{landingContent.footer.tagline}</p>
            </div>

            {/* Footer Columns */}
            {landingContent.footer.columns.map((column, i) => (
              <div key={i}>
                <h3 className="text-white font-semibold mb-4">{column.title}</h3>
                <ul className="space-y-2">
                  {column.links.map((link, j) => (
                    <li key={j}>
                      <Link href={link.href} className="text-gray-400 hover:text-white text-sm transition">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-gray-400">
            <p>{landingContent.footer.copyright}</p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              {landingContent.footer.social.map((social, i) => (
                <a key={i} href={social.url} className="hover:text-white transition">
                  {social.platform}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
