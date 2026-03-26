export interface StripeProduct {
  id: string;
  name: string;
  description?: string;
  prices?: { id: string; unit_amount: number; currency: string; recurring?: { interval: string } }[];
}