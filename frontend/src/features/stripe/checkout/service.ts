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
): Promise<void> {
  
  // classify if the user is signed in
  

  backendClient.post(
    '/api/v1/billing/checkout',
    {
      product_id: planId,
      success_url: successUrl,
    }
  )
}