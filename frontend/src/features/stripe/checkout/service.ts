// ─────────────────────────────────────────────────────────────────────────────
// startCheckout
// ─────────────────────────────────────────────────────────────────────────────

import backendClient from "@/lib/api/clients/backendClient";


/**
 * Start a new Stripe Checkout session for a user who has no subscription.
 * Mirrors the `/checkout` page flow exactly.
 *
 * Throws `'not_authenticated'` | `'session_expired'` | `'no_product_id'` | `Error`
 */
export async function startCheckout(
  planId: string,
  successUrl: string,
  teamId?: string,
): Promise<void> {
  const body: any = {
    product_price_id: planId,
    success_url: successUrl,
  };
  if (teamId) body.team_id = teamId;

  const resp = await backendClient.post('/api/v1/billing/checkout', body);

  // Expect backend to return JSON with `checkout_url` or `url`
  const data = resp?.data ?? resp;
  const url = data?.checkout_url || data?.url;
  if (!url) throw new Error('Checkout URL not returned by server');

  // Redirect user to provider checkout
  if (typeof window !== 'undefined') {
    window.location.href = url;
  }
}