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

// ── Plan Order ────────────────────────────────────────────────────────────────

/** Global ordering of plans from lowest to highest tier */
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
