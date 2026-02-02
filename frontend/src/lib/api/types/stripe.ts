import type { Database } from '@/types/stripe';

export type StripeProduct = Database['stripe']['Tables']['products']['Row'];
export type StripePrice = Database['stripe']['Tables']['prices']['Row'];
export type StripeSubscription = Database['stripe']['Tables']['subscriptions']['Row'];

export interface ProductResponse {
  product: StripeProduct | null | any;
  prices: StripePrice[];
}

export interface ProductsResponse {
  products: StripeProduct[];
}

export type StripePlan = {
  id: string;
  nickname?: string | null;
  amount?: number | null;
  currency?: string | null;
  product?: string | null;
};

export interface PlansResponse {
  plans: StripePlan[];
}

export {};
