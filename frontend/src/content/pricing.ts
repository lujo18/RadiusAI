/**
 * Pricing Page Content
 *
 * Edit this file to update marketing copy, comparison tables, and FAQs.
 *
 * ⚠️  Plan names, features, and limits are defined in ONE place:
 *     src/lib/plans.ts  ← edit that file, not here
 *
 * The `plans` key below re-exports from plans.ts so all consumers
 * stay in sync automatically.
 */

import { PLANS } from '@/lib/plans';

export const pricingContent = {
  // ==========================================
  // HERO / HEADER
  // ==========================================
  hero: {
    headline: "Pricing for TikTok slideshow automation & Instagram carousels",
    subheadline: "Plans designed for solo creators, growth teams, and agencies building high-performing carousels. No hidden fees.",
    badge: "Save 30% with annual billing"
  },

  // ==========================================
  // PLANS — sourced from src/lib/plans.ts
  // ==========================================
  plans: PLANS,

  // ==========================================
  // SOCIAL PROOF
  // ==========================================
  socialProof: {
    headline: "Trusted by creators at:",
    companies: [
      "Google", "Meta", "Netflix", "Spotify", "Apple", 
      "Amazon", "Microsoft", "Tesla", "Nike"
    ]
  },

  // ==========================================
  // FEATURE COMPARISON TABLE
  // ==========================================
  comparison: {
    headline: "Compare our plans",
    subheadline: "Find the perfect plan for TikTok slideshow automation, CTA testing, and scaled carousel production",
    categories: [
      {
        name: "Content Generation",
        features: [
          { name: "Posts per month", starter: "5", pro: "Unlimited", agency: "Unlimited" },
          { name: "AI generations", starter: "10", pro: "Unlimited", agency: "Unlimited" },
          { name: "Templates", starter: "3", pro: "50+", agency: "50+ Custom" },
          { name: "Batch generation", starter: false, pro: true, agency: true },
          { name: "Content calendar", starter: false, pro: true, agency: true }
        ]
      },
      {
        name: "A/B Testing & Analytics",
        features: [
          { name: "Basic analytics", starter: true, pro: true, agency: true },
          { name: "Advanced analytics", starter: false, pro: true, agency: true },
          { name: "A/B testing", starter: false, pro: "3 variants", agency: "Unlimited" },
          { name: "Performance insights", starter: false, pro: true, agency: true },
          { name: "Export reports", starter: false, pro: true, agency: true }
        ]
      },
      {
        name: "Branding & Customization",
        features: [
          { name: "Brand profiles", starter: "1", pro: "5", agency: "20" },
          { name: "Custom colors", starter: true, pro: true, agency: true },
          { name: "Custom fonts", starter: false, pro: true, agency: true },
          { name: "White-label exports", starter: false, pro: false, agency: true },
          { name: "Custom templates", starter: false, pro: false, agency: true }
        ]
      },
      {
        name: "Team & Collaboration",
        features: [
          { name: "Team members", starter: "1", pro: "5", agency: "Unlimited" },
          { name: "Role permissions", starter: false, pro: true, agency: true },
          { name: "Shared workspaces", starter: false, pro: true, agency: true },
          { name: "SSO", starter: false, pro: false, agency: "Coming soon" }
        ]
      },
      {
        name: "Support",
        features: [
          { name: "Email support", starter: true, pro: true, agency: true },
          { name: "Priority support", starter: false, pro: true, agency: true },
          { name: "Dedicated manager", starter: false, pro: false, agency: true },
          { name: "Onboarding call", starter: false, pro: false, agency: true }
        ]
      }
    ]
  },

  // ==========================================
  // FAQ (Pricing-specific)
  // ==========================================
  faq: {
    headline: "Frequently Asked Questions",
    items: [
      {
        question: "Can I switch plans anytime?",
        answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any payments."
      },
      {
        question: "What happens if I exceed my plan limits?",
        answer: "If you're on the Starter plan and hit your 5-post limit, you'll be prompted to upgrade. Pro and Agency plans have unlimited posts, so you'll never hit a limit."
      },
      {
        question: "Do you offer refunds?",
        answer: "Yes! We offer a 7-day money-back guarantee. If you're not satisfied within the first week, we'll refund you in full, no questions asked."
      },
      {
        question: "How does the annual discount work?",
        answer: "Pay annually and save 30% compared to monthly billing. The discount is applied automatically when you toggle to yearly billing."
      },
      {
        question: "Can I cancel my subscription?",
        answer: "Absolutely. You can cancel anytime from your dashboard. You'll keep access until the end of your billing period."
      },
      {
        question: "Do you offer custom enterprise plans?",
        answer: "Yes! If you need more than 20 brand profiles or have specific requirements, contact us for a custom enterprise plan tailored to your needs."
      }
    ]
  },

  // ==========================================
  // FINAL CTA
  // ==========================================
  cta: {
    headline: "Ready to automate TikTok slideshows and scale carousels?",
    subheadline: "Join thousands of creators using automated CTA testing and niche templates to increase engagement.",
    ctaPrimary: "Get Started",
    features: ["Instant access", "All features included", "Cancel anytime"]
  }
};
