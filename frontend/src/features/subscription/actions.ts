/**
 * Centralized billing actions
 *
 * All checkout, plan-switch, and portal operations go through here.
 * This mirrors the logic in /checkout/page.tsx which is the proven working flow.
 *
 * Usage:
 *   import { startCheckout, switchPlan, openPortal } from '@/features/subscription/actions';
 */

import { supabase } from '@/lib/supabase/client';
import { type PlanKey } from '@/lib/plans';

const apiBase = () => process.env.NEXT_PUBLIC_API_URL || '';

/** Map plan keys to Stripe product IDs via env vars (same as /checkout page). */
function getProductId(planKey: PlanKey): string | null {
  const map: Record<PlanKey, string | undefined> = {
    starter: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_STARTER,
    growth: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_GROWTH,
    unlimited: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_UNLIMITED,
  };
  return map[planKey] || null;
}

/** Get a valid Supabase session, throwing if the user isn't authenticated. */
async function requireSession() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (!user || error) throw new Error('not_authenticated');

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (!session || sessionError) throw new Error('not_authenticated');

  const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
  if (expiresAt < Date.now()) {
    await supabase.auth.signOut();
    throw new Error('session_expired');
  }

  return { user, session };
}

// ─────────────────────────────────────────────────────────────────────────────
// startCheckout
// ─────────────────────────────────────────────────────────────────────────────

export interface StartCheckoutOptions {
  /** URL to land on after successful payment. Defaults to /overview */
  successUrl?: string;
  /** URL Stripe returns to on cancel. Defaults to current page */
  cancelUrl?: string;
}

/**
 * Start a new Stripe Checkout session for a user who has no subscription.
 * Mirrors the `/checkout` page flow exactly.
 *
 * Throws `'not_authenticated'` | `'session_expired'` | `'no_product_id'` | `Error`
 */
export async function startCheckout(
  planKey: PlanKey,
  options: StartCheckoutOptions = {}
): Promise<void> {
  const { user, session } = await requireSession();

  // Check if already subscribed
  const { data: userData } = await supabase
    .from('users')
    .select('subscription_status, stripe_subscription_id')
    .eq('id', user.id)
    .single();

  if (userData?.subscription_status === 'active' && userData?.stripe_subscription_id) {
    // Already subscribed — send to overview
    window.location.href = '/overview?message=already_subscribed';
    return;
  }

  const productId = getProductId(planKey);
  if (!productId) throw new Error('no_product_id');

  const successUrl = options.successUrl ?? `${window.location.origin}/overview`;
  const cancelUrl = options.cancelUrl ?? window.location.href;

  const res = await fetch(`${apiBase()}/api/billing/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      product_id: productId,
      user_id: user.id,
      plan: planKey,
      success_url: successUrl,
      cancel_url: cancelUrl,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.detail || 'checkout_failed');
  }

  const data = await res.json();
  if (!data.url) throw new Error('checkout_no_url');

  window.location.href = data.url;
}

// ─────────────────────────────────────────────────────────────────────────────
// switchPlan  (upgrade / downgrade for existing subscribers)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Switch an active subscription to a different plan via the upgrade endpoint.
 * Uses the price_id + product_id returned by /api/billing/available-upgrades.
 */
export async function switchPlan(priceId: string, productId: string): Promise<void> {
  const { session } = await requireSession();

  const res = await fetch(`${apiBase()}/api/billing/upgrade`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ newPriceId: priceId, newProductId: productId }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.detail || 'switch_failed');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// openPortal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Open the Stripe Customer Portal in a new tab so the user can manage
 * payment methods, billing frequency, and cancellation.
 */
export async function openPortal(): Promise<void> {
  const { session } = await requireSession();

  const res = await fetch(`${apiBase()}/api/billing/portal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.detail || 'portal_failed');
  }

  const data = await res.json();
  if (!data.url) throw new Error('portal_no_url');

  window.open(data.url, '_blank');
}
