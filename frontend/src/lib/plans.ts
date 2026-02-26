/**
 * ─────────────────────────────────────────────────────
 *  PLAN DEFINITIONS — SINGLE SOURCE OF TRUTH
 * ─────────────────────────────────────────────────────
 *
 * Edit this file to change plan names, limits, features,
 * and display copy across the entire app. All other files
 * should import from here rather than defining their own.
 *
 * Plan keys:  'starter' | 'growth' | 'unlimited'
 * Prices:     fetched live from Stripe API (unit_amount / 100)
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type PlanKey = 'starter' | 'growth' | 'unlimited';

/** Hard usage caps enforced client-side and server-side. Use Infinity for "no limit". */
export interface PlanLimits {
  /** Brand profiles per team */
  brands: number;
  /** Templates the team can create */
  templates: number;
  /** Posts per month */
  posts: number;
  /** AI generation credits per month */
  aiGenerations: number;
  /** Team members */
  teamMembers: number;
}

export interface PlanDefinition {
  /** Canonical key — matches what Stripe product name resolves to via toPlanKey() */
  key: PlanKey;
  /** Display name shown in UI */
  name: string;
  /** Short tagline shown under the plan name */
  description: string;
  /** Optional badge shown on the card (null = no badge) */
  badge: string | null;
  /** Whether this plan is visually highlighted as recommended */
  highlight: boolean;
  /** Feature bullet points shown on plan cards */
  features: string[];
  /** Quantitative limits used by usePlanLimits() and FeatureLock */
  limits: PlanLimits;
}

// ── Plan Definitions ───────────────────────────────────────────────────────

export const PLANS: Record<PlanKey, PlanDefinition> = {
  starter: {
    key: 'starter',
    name: 'Starter',
    description: 'Perfect for testing and small projects',
    badge: null,
    highlight: false,
    features: [
      '20 posts per month',
      '5 template options',
      'Basic analytics',
      'Email support',
      '1 brand profile',
      'Standard quality exports',
    ],
    limits: {
      brands: 1,
      templates: 5,
      posts: 20,
      aiGenerations: 50,
      teamMembers: 1,
    },
  },

  growth: {
    key: 'growth',
    name: 'Growth',
    description: 'For serious creators and businesses',
    badge: 'Most Popular',
    highlight: true,
    features: [
      'Unlimited posts',
      '50+ premium templates',
      'A/B testing (3 variants)',
      'Advanced analytics',
      'Priority support',
      'Custom branding',
      '5 brand profiles',
      'HD exports',
      'Content calendar',
      'Batch generation',
    ],
    limits: {
      brands: 5,
      templates: 50,
      posts: Infinity,
      aiGenerations: Infinity,
      teamMembers: 5,
    },
  },

  unlimited: {
    key: 'unlimited',
    name: 'Unlimited',
    description: 'For agencies and large teams',
    badge: 'Best Value',
    highlight: false,
    features: [
      'Everything in Growth',
      'Unlimited team members',
      '20 brand profiles',
      'White-label exports',
      'API access',
      'Dedicated account manager',
      'Custom templates',
      'Priority processing',
      'Advanced permissions',
      'SSO (coming soon)',
    ],
    limits: {
      brands: 20,
      templates: Infinity,
      posts: Infinity,
      aiGenerations: Infinity,
      teamMembers: Infinity,
    },
  },
};

// ── Ordered list (cheapest → most expensive) ───────────────────────────────

export const PLAN_ORDER: PlanKey[] = ['starter', 'growth', 'unlimited'];

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Resolve a Stripe product name (or any loose string containing a plan name)
 * to its canonical PlanKey.  Returns null when unrecognized.
 *
 * Examples:
 *   "Growth Plan"  → 'growth'
 *   "Pro"          → 'growth'   (legacy alias)
 *   "Agency"       → 'unlimited' (legacy alias)
 */
export function toPlanKey(name: string): PlanKey | null {
  const n = name.toLowerCase();
  if (n.includes('unlimited') || n.includes('agency')) return 'unlimited';
  if (n.includes('growth') || n.includes('pro')) return 'growth';
  if (n.includes('starter') || n.includes('free')) return 'starter';
  return null;
}

/** Return the numeric rank of a plan (0 = lowest). */
export function planRank(key: PlanKey): number {
  return PLAN_ORDER.indexOf(key);
}

/** True if `target` is a higher tier than `current`. */
export function isUpgrade(current: PlanKey, target: PlanKey): boolean {
  return planRank(target) > planRank(current);
}

/** True if `target` is a lower tier than `current`. */
export function isDowngrade(current: PlanKey, target: PlanKey): boolean {
  return planRank(target) < planRank(current);
}

/**
 * Check whether a numeric count is within a plan's limit for a given resource.
 * Infinity limits always return true.
 */
export function withinLimit(limit: number, currentCount: number): boolean {
  return currentCount < limit;
}

/** Format a limit value for display ("Unlimited" vs the raw number). */
export function formatLimit(limit: number): string {
  return limit === Infinity ? 'Unlimited' : String(limit);
}
