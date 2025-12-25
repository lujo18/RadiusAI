/**
 * Landing Page Content
 * 
 * Edit this file to update copy across the landing page.
 * Structure matches content.json schema for easy CMS migration.
 */

export const landingContent = {
  // ==========================================
  // HERO SECTION
  // ==========================================
  hero: {
    badge: "🎉 Now with Gemini 2.0 Flash",
    headline: "Create Viral Carousels in Seconds",
    subheadline: "AI-powered Instagram & TikTok content that actually performs. Generate, A/B test, and optimize your social media on autopilot.",
    ctaPrimary: "Get Started",
    ctaSecondary: "Watch Demo",
    videoUrl: null, // Add demo video URL when ready
    features: [
      "✓ Start creating instantly",
      "✓ All features included",
      "✓ Cancel anytime"
    ]
  },

  // ==========================================
  // PARTNERS / SOCIAL PROOF
  // ==========================================
  partners: {
    headline: "Trusted by creators worldwide",
    logos: [
      // Add partner logos to Supabase Storage, reference here
      // { name: "Company", imageUrl: "..." }
    ]
  },

  // ==========================================
  // BENEFITS SECTION
  // ==========================================
  benefits: {
    headline: "Everything you need to dominate social media",
    subheadline: "Focus on what it helps you do, not just features",
    items: [
      {
        icon: "🎨",
        title: "Professional Templates",
        description: "Choose from 50+ proven carousel templates designed to convert. No design skills needed."
      },
      {
        icon: "🤖",
        title: "AI Content Generation",
        description: "Gemini 2.0 writes engaging hooks, value-packed slides, and CTAs that drive action."
      },
      {
        icon: "📊",
        title: "Smart A/B Testing",
        description: "Test multiple variants automatically and discover what resonates with your audience."
      },
      {
        icon: "📈",
        title: "Performance Analytics",
        description: "Track saves, shares, and engagement. Know exactly what's working."
      },
      {
        icon: "⚡",
        title: "Batch Generation",
        description: "Create a week's worth of content in 5 minutes. Schedule and forget."
      },
      {
        icon: "🎯",
        title: "Brand Consistency",
        description: "Custom style guides ensure every post matches your visual identity perfectly."
      }
    ]
  },

  // ==========================================
  // HOW IT WORKS
  // ==========================================
  howItWorks: {
    headline: "Get started in 3 simple steps",
    steps: [
      {
        number: 1,
        title: "Choose a Template",
        description: "Pick from our library of high-converting carousel formats (listicles, quotes, stories, educational)"
      },
      {
        number: 2,
        title: "Let AI Create",
        description: "Enter your topic. Our AI generates slides, captions, and hashtags tailored to your brand."
      },
      {
        number: 3,
        title: "Publish & Optimize",
        description: "Download or schedule directly. Track performance and iterate based on real data."
      }
    ]
  },

  // ==========================================
  // PRICING (Data comes from Stripe, copy here)
  // ==========================================
  pricing: {
    headline: "Pricing - Why to buy/How it helps",
    subheadline: "Transparent pricing. No hidden fees. Scale as you grow.",
    ctaNote: "All plans include 7-day free trial",
    plansDescription: {
      starter: {
        highlight: "Perfect for testing",
        features: [
          "5 posts per month",
          "3 templates",
          "Basic analytics",
          "Email support"
        ]
      },
      pro: {
        highlight: "Most popular - For serious creators",
        features: [
          "Unlimited posts",
          "All 50+ templates",
          "A/B testing (3 variants)",
          "Advanced analytics",
          "Priority support",
          "Custom branding"
        ]
      },
      agency: {
        highlight: "For agencies & teams",
        features: [
          "Everything in Pro",
          "5 team members",
          "10 brand profiles",
          "White-label exports",
          "API access",
          "Dedicated account manager"
        ]
      }
    }
  },

  // ==========================================
  // TESTIMONIALS (Schema - actual data in Supabase)
  // ==========================================
  testimonials: {
    headline: "Loved by people worldwide",
    subheadline: "See what creators are saying about ViralStack",
    // Testimonials pulled from Supabase `testimonials` table
    // Schema: { id, name, role, quote, avatar_url, rating, created_at }
  },

  // ==========================================
  // FAQ (Editable)
  // ==========================================
  faq: {
    headline: "Frequently Asked Questions",
    subheadline: "Everything you need to know about ViralStack",
    items: [
      {
        question: "Do I need design experience?",
        answer: "Not at all! Our AI handles everything from layout to copy. You just pick a template and enter your topic. Perfect for creators who want professional results without the learning curve."
      },
      {
        question: "How does A/B testing work?",
        answer: "You create 2-4 template variants (e.g., different hook styles). ViralStack generates content for each, tracks performance, and shows you which one performs best based on saves, shares, and engagement."
      },
      {
        question: "Can I customize the templates?",
        answer: "Absolutely! Every template is fully customizable - change colors, fonts, backgrounds, content structure. You can also create your own templates and save them for reuse."
      },
      {
        question: "What platforms does it support?",
        answer: "Currently Instagram and TikTok carousels. We're adding LinkedIn carousels, YouTube Community posts, and Twitter threads soon."
      },
      {
        question: "How do I cancel my subscription?",
        answer: "Cancel anytime from your dashboard. No questions asked. You'll keep access until the end of your billing period."
      },
      {
        question: "Do you offer refunds?",
        answer: "Yes! If you're not satisfied within the first 7 days, we'll refund you in full. Just email support@viralstack.app."
      }
    ]
  },

  // ==========================================
  // FINAL CTA SECTION
  // ==========================================
  cta: {
    headline: "Ready to 10x your social media output?",
    subheadline: "Join 1,000+ creators who've automated their content pipeline",
    ctaPrimary: "Get Started",
    ctaSecondary: "Book a Demo"
  },

  // ==========================================
  // FOOTER
  // ==========================================
  footer: {
    tagline: "AI-powered carousel automation for modern creators",
    columns: [
      {
        title: "Product",
        links: [
          { label: "Features", href: "#benefits" },
          { label: "Pricing", href: "#pricing" },
          { label: "Templates", href: "/templates" },
          { label: "Changelog", href: "/changelog" }
        ]
      },
      {
        title: "Resources",
        links: [
          { label: "Documentation", href: "/docs" },
          { label: "API", href: "/api-docs" },
          { label: "Blog", href: "/blog" },
          { label: "Case Studies", href: "/case-studies" }
        ]
      },
      {
        title: "Company",
        links: [
          { label: "About", href: "/about" },
          { label: "Contact", href: "/contact" },
          { label: "Privacy Policy", href: "/privacy" },
          { label: "Terms of Service", href: "/terms" }
        ]
      }
    ],
    social: [
      { platform: "Twitter", url: "https://twitter.com/viralstack" },
      { platform: "Instagram", url: "https://instagram.com/viralstack" },
      { platform: "LinkedIn", url: "https://linkedin.com/company/viralstack" }
    ],
    copyright: `© ${new Date().getFullYear()} ViralStack. All rights reserved.`
  }
};

// ==========================================
// DYNAMIC METRICS (pulled from API)
// ==========================================
export type DynamicMetrics = {
  totalUsers: number;
  postsGenerated: number;
  templatesAvailable: number;
  avgEngagementIncrease: string; // e.g., "127%"
};
