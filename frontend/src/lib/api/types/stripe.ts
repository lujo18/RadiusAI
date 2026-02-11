export type StripePlan = {
  id: string;
  nickname?: string;
  price?: number;
  currency?: string;
  interval?: 'month' | 'year' | string;
  metadata?: Record<string, any>;
};

export type PlansResponse = {
  plans: StripePlan[];
};

export type StripeProduct = {
  id: string;
  name?: string;
  description?: string;
  metadata?: Record<string, any>;
};

export type ProductsResponse = {
  products: StripeProduct[];
};

export type StripeSubscription = {
  id: string;
  customer_id?: string;
  status?: string;
  price_id?: string;
  current_period_end?: number;
  items?: any;
  plan?: any;
  metadata?: Record<string, any>;
};
