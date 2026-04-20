// DELETE: Depreciated — Stripe-shaped product type. Use `frontend/src/types/billing.ts` instead.
export interface StripeProduct {
  id: string;
  name: string;
  description?: string;
  prices?: { id: string; unit_amount: number; currency: string; recurring?: { interval: string } }[];
}