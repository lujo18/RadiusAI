/**
 * Landing Page Content
 * * Edit this file to update copy across the landing page.
 * Structure matches content.json schema for easy CMS migration.
 */

export const landingContent = {
  // ==========================================
  // HERO SECTION
  // ==========================================
  hero: {
    badge: "Built for High-Signal Founders",
    headline: "Stop Posting for Likes. Start Engineering for Customers.",
    subheadline: "The only Social Intelligence Engine that bypasses generic AI noise to turn passive viewers into loyal customers autonomously.",
    ctaPrimary: "Initialize Your Engine",
    ctaSecondary: "Watch Architecture Demo",
    videoUrl: null, // Add demo video URL when ready
    features: [
      "Expert-tuned conversion weights",
      "Autonomous A/B optimization",
      "Founder-led engineering"
    ]
  },

  // ==========================================
  // PARTNERS / SOCIAL PROOF
  // ==========================================
  partners: {
    headline: "Powering the next generation of lean, high-revenue solo operations",
    logos: [
      // Add partner logos to Supabase Storage, reference here
      // { name: "Company", imageUrl: "..." }
    ]
  },

  // ==========================================
  // BENEFITS SECTION
  // ==========================================
  benefits: {
    headline: "The Gold Standard in Autonomous Social Synthesis",
    subheadline: "While others focus on volume, Radius focuses on liquidity. Our internal architecture is designed by growth experts to handle the heavy lifting of customer acquisition so you don't have to.",
    items: [
      {
        icon: "Cpu",
        title: "The Radius Context Engine™",
        description: "Our proprietary logic doesn't just 'generate text.' It synthesizes your brand DNA into high-intent hooks and narratives that sound like a founder, not a bot."
      },
      {
        icon: "BarChart2",
        title: "Autonomous Revenue Loops",
        description: "Beyond simple A/B testing, Radius runs internal simulations to identify the 'Conversion Probability' of every slide before it ever hits the feed."
      },
      {
        icon: "Palette",
        title: "Architect-Grade Design Systems",
        description: "Move past generic templates. Access high-fidelity design frameworks engineered specifically for SaaS, E-commerce, and Digital Course conversion."
      },
      {
        icon: "Zap",
        title: "Zero-Prompt Intelligence",
        description: "Stop wasting hours on prompt engineering. Radius is pre-calibrated with the top 0.1% of social sales data. One click initiates the generation cycle."
      },
      {
        icon: "Target",
        title: "Behavioral CTA Interval Testing",
        description: "Automatically rotates psychological triggers and calls-to-action to find the exact friction point that turns a follower into a buyer."
      },
      {
        icon: "ShieldCheck",
        title: "Sovereign Brand Identity",
        description: "A specialized style-guard system ensures every pixel and every word aligns with your premium market positioning, ensuring total brand trust."
      }
    ]
  },

  // ==========================================
  // HOW IT WORKS
  // ==========================================
  howItWorks: {
    headline: "Three Steps to Full-Autonomy Growth",
    steps: [
      {
        number: 1,
        title: "Calibrate Your Brand DNA",
        description: "Input your core offer and audience. Radius maps your brand voice to our internal 'Expert-In-The-Loop' framework to ensure high-signal output."
      },
      {
        number: 2,
        title: "Synthesize Content Sequences",
        description: "The Radius Engine generates a week of high-converting carousels, optimized for algorithm retention and behavioral sales psychology."
      },
      {
        number: 3,
        title: "Activate Autonomous Scaling",
        description: "Deploy and let Radius monitor performance. The system learns from every save and click to refine your future content loops automatically."
      }
    ]
  },

  // ==========================================
  // PRICING (Data comes from Stripe, copy here)
  // ==========================================
  pricing: {
    headline: "Invest in Your Infrastructure",
    subheadline: "Premium tools for founders who value their time at $500/hr. No fluff, just the engine. Select the tier that fits your growth trajectory.",
    ctaNote: "Join the elite circle of autonomous creators. Upgrade or cancel anytime.",
    plansDescription: {
      starter: {
        highlight: "For the Solo Architect",
        features: [
          "5 high-signal posts per month",
          "Core Radius Context Engine",
          "Basic Performance Metrics",
          "Founder-led Support"
        ]
      },
      pro: {
        highlight: "The Standard - Most Popular",
        features: [
          "Unlimited Autonomous Generation",
          "Full Library of Conversion Frameworks",
          "Neural CTA Interval Testing",
          "Advanced Revenue Analytics",
          "Priority Engine Access",
          "Custom Brand Vector Mapping"
        ]
      },
      agency: {
        highlight: "For Growth Operations",
        features: [
          "Everything in Pro",
          "Multi-Brand Management (10 Profiles)",
          "Team Collaboration (5 Members)",
          "White-Label Exports & API Access",
          "Dedicated Strategy Architect"
        ]
      }
    }
  },

  // ==========================================
  // TESTIMONIALS (Schema - actual data in Supabase)
  // ==========================================
  testimonials: {
    headline: "Trusted by founders who demand precision",
    subheadline: "See how high-value creators are offloading their growth to Radius",
    // Testimonials pulled from Supabase `testimonials` table
    // Schema: { id, name, role, quote, avatar_url, rating, created_at }
  },

  // ==========================================
  // FAQ (Editable)
  // ==========================================
  faq: {
    headline: "The Radius Intelligence Brief",
    subheadline: "Everything you need to know about setting up your social sales engine on autopilot.",
    items: [
      {
        question: "How is Radius different from generic AI tools?",
        answer: "Most tools are simple 'wrappers' for generic AI. Radius is a Social Intelligence Engine built with proprietary conversion weights. We don't just 'make content'; we architect sales sequences using internal logic that generic AI cannot replicate."
      },
      {
        question: "Does this require me to be a 'Prompt Engineer'?",
        answer: "No. Prompting is a flaw in other systems. Radius is designed to be 'Zero-Prompt.' We handle the complex engineering internally so you only have to focus on your business vision."
      },
      {
        question: "How does the A/B CTA testing work?",
        answer: "Radius generates variants with different psychological triggers. Our system runs automated tests across your sequences and highlights winners using high-signal engagement data like saves and clicks."
      },
      {
        question: "What platforms does it support?",
        answer: "Currently, we provide the gold standard for TikTok slideshows and Instagram carousels. We are actively expanding our architecture to LinkedIn and other high-intent platforms."
      },
      {
        question: "Why should I trust a solo-founder tool over a large company?",
        answer: "Radius is a boutique engineering lab. Unlike mass-market tools built by committees, Radius is built by a single architect obsessed with conversion math—ensuring a level of quality and precision that 'factories' can't match."
      },
      {
        question: "What is your refund policy?",
        answer: "We stand by our architecture. If you're not satisfied within the first 7 days, we'll refund you in full. Just contact the architect at support@Radius.app."
      }
    ]
  },

  // ==========================================
  // FINAL CTA SECTION
  // ==========================================
  cta: {
    headline: "Ready to Install Your Autonomous Sales Force?",
    subheadline: "Stop posting for likes. Start engineering for revenue with Radius.",
    ctaPrimary: "Deploy Radius Now",
    ctaSecondary: ""
  },

  // ==========================================
  // FOOTER
  // ==========================================
  footer: {
    tagline: "The Sovereign Standard in Social Media Intelligence.",
    columns: [
      {
        title: "Engine",
        links: [
          { label: "Architecture", href: "#benefits" },
          { label: "Pricing", href: "#pricing" },
          { label: "Frameworks", href: "/templates" },
          { label: "Updates", href: "/changelog" }
        ]
      },
      {
        title: "Intelligence",
        links: [
          { label: "Logic Documentation", href: "/docs" },
          { label: "API Protocol", href: "/api-docs" },
          { label: "The Founder's Blog", href: "/blog" },
          { label: "Revenue Studies", href: "/case-studies" }
        ]
      },
      {
        title: "Laboratory",
        links: [
          { label: "The Vision", href: "/about" },
          { label: "Contact Architect", href: "/contact" },
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
    copyright: `© ${new Date().getFullYear()} Radius. Engineered for Excellence.`
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