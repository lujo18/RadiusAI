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
    badge: "Now with Gemini 2.0 Flash",
    headline: "TikTok & Instagram carousel generator — create slideshows fast",
    subheadline: "Automated TikTok slideshow automation and Instagram carousel creation with built-in A/B CTA interval testing and niche templates to boost engagement.",
    ctaPrimary: "Get Started",
    ctaSecondary: "Watch Demo",
    videoUrl: null, // Add demo video URL when ready
    features: [
      "Start creating instantly",
      "All features included",
      "Cancel anytime"
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
    headline: "Everything you need to win on TikTok & Instagram",
    subheadline: "Built for creators who want TikTok slideshow automation, Instagram carousel templates, and reliable CTA interval testing",
    items: [
      {
        icon: "Palette",
        title: "Professional Templates",
        description: "Choose from 50+ proven carousel templates (TikTok slideshows, Instagram carousels) built for specific niches. No design skills needed."
      },
      {
        icon: "Cpu",
        title: "AI Content Generation",
        description: "Gemini 2.0 writes engaging hooks, value-packed slides, and CTAs optimized for saves, shares, and conversions."
      },
      {
        icon: "BarChart2",
        title: "Smart A/B Testing",
        description: "Automated A/B testing with CTA interval testing so you can find the highest-performing slide order and calls-to-action."
      },
      {
        icon: "TrendingUp",
        title: "Performance Analytics",
        description: "Track saves, shares, and engagement. Know exactly what's working."
      },
      {
        icon: "Zap",
        title: "Batch Generation",
        description: "Create a week's worth of content in 5 minutes. Schedule and forget."
      },
      {
        icon: "Target",
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
        description: "Pick from our library of high-converting carousel formats (TikTok slideshow, Instagram listicles, stories, educational)"
      },
      {
        number: 2,
        title: "Let AI Create",
        description: "Enter your topic and target audience. Our AI generates slides, captions, and hashtags tailored to your niche and platform (TikTok, Instagram)."
      },
      {
        number: 3,
        title: "Publish & Optimize",
        description: "Download or schedule directly. Track engagement metrics and iterate using automated performance insights and CTA testing."
      }
    ]
  },

  // ==========================================
  // PRICING (Data comes from Stripe, copy here)
  // ==========================================
  pricing: {
    headline: "Pricing - Plans for solo creators to agencies",
    subheadline: "Transparent pricing for TikTok slideshow automation and enterprise carousel generation. No hidden fees. Scale as you grow.",
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
    subheadline: "See what creators are saying about Radius",
    // Testimonials pulled from Supabase `testimonials` table
    // Schema: { id, name, role, quote, avatar_url, rating, created_at }
  },

  // ==========================================
  // FAQ (Editable)
  // ==========================================
  faq: {
    headline: "Frequently Asked Questions",
    subheadline: "Everything you need to know about Radius",
    items: [
      {
        question: "Do I need design experience?",
        answer: "Not at all! Our AI handles layout, copy, and slide sequencing for TikTok slideshows and Instagram carousels. Pick a niche template and publish."
      },
      {
        question: "How does A/B testing work?",
        answer: "Create 2-4 template variants (different hooks, CTA placements, or slide orders). Radius generates each variant, runs automated tests, and highlights winners using engagement signals like saves, shares, and clicks."
      },
      {
        question: "Can I customize the templates?",
        answer: "Absolutely! Every template is fully customizable - change colors, fonts, backgrounds, content structure. You can also create your own templates and save them for reuse."
      },
      {
        question: "What platforms does it support?",
        answer: "TikTok slideshow automation and Instagram carousel generation are fully supported. We're expanding to LinkedIn carousels and other formats soon."
      },
      {
        question: "How do I cancel my subscription?",
        answer: "Cancel anytime from your dashboard. No questions asked. You'll keep access until the end of your billing period."
      },
      {
        question: "Do you offer refunds?",
        answer: "Yes! If you're not satisfied within the first 7 days, we'll refund you in full. Just email support@Radius.app."
      }
    ]
  },

  // ==========================================
  // FINAL CTA SECTION
  // ==========================================
  cta: {
    headline: "Ready to automate your TikTok slideshows and Instagram carousels?",
    subheadline: "Join creators who use automated CTA testing and niche templates to grow faster",
    ctaPrimary: "Get Started",
    ctaSecondary: "Book a Demo"
  },

  // ==========================================
  // FOOTER
  // ==========================================
  footer: {
    tagline: "AI-powered TikTok slideshow automation & Instagram carousel generator",
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
      { platform: "Twitter", url: "https://twitter.com/Radius" },
      { platform: "Instagram", url: "https://instagram.com/Radius" },
      { platform: "LinkedIn", url: "https://linkedin.com/company/Radius" }
    ],
    copyright: `© ${new Date().getFullYear()} Radius. All rights reserved.`
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
