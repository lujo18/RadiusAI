// DELETE: Depreciated — Plan types modeled for Stripe-backed plans. Migrate to provider-agnostic billing types.
import type { Database } from '@/types/database';

// DELETE: Depreciated placeholder type — use provider-agnostic plan types in future refactors.
export type PlanRecord = any;
export interface AvailableUpgrade {
  product_id: string;
  price_id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  interval: string;
  metadata: Record<string, string>;
}