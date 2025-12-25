/**
 * Pricing Page Content
 * 
 * Edit this file to update pricing page copy, features, and comparisons.
 */

export const pricingContent = {
  // ==========================================
  // HERO / HEADER
  // ==========================================
  hero: {
    headline: "Simple, Transparent Pricing",
    subheadline: "Choose the plan that fits your content creation needs. No hidden fees. Cancel anytime.",
    badge: "Save 30% with annual billing"
  },

  // ==========================================
  // PLANS (Prices pulled from Stripe API)
  // ==========================================
  plans: {
    starter: {
      name: "Starter",
      description: "Perfect for testing and small projects",
      badge: null,
      features: [
        "20 posts per month",
        "5 template options",
        "Basic analytics",
        "Email support",
        "1 brand profile",
        "Standard quality exports"
      ]
    },
    growth: {
      name: "Growth",
      description: "For serious creators and businesses",
      badge: "Most Popular",
      features: [
        "Unlimited posts",
        "50+ premium templates",
        "A/B testing (3 variants)",
        "Advanced analytics",
        "Priority support",
        "Custom branding",
        "5 brand profiles",
        "HD exports",
        "Content calendar",
        "Batch generation"
      ]
    },
    unlimited: {
      name: "Unlimited",
      description: "For agencies and large teams",
      badge: "Best Value",
      features: [
        "Everything in Pro",
        "Unlimited team members",
        "20 brand profiles",
        "White-label exports",
        "API access",
        "Dedicated account manager",
        "Custom templates",
        "Priority processing",
        "Advanced permissions",
        "SSO (coming soon)"
      ]
    }
  },

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
    subheadline: "Find the perfect plan for your needs",
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
    headline: "Ready to create viral content?",
    subheadline: "Join thousands of creators who've automated their content pipeline with ViralStack.",
    ctaPrimary: "Get Started",
    features: ["✓ Instant access", "✓ All features included", "✓ Cancel anytime"]
  }
};
