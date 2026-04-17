export type Provider = 'polar' | 'stripe' | 'other';

export interface Price {
  recurring_interval: string;
  price_currency: any;
  price_amount: number;
  id: string; // internal DB id
  external_id: string; // provider price id (e.g. Polar price id)
  interval?: 'monthly' | 'yearly' | string;
  amount: number; // amount in minor units (cents)
  currency: string;
  metadata?: Record<string, any>;
}

export interface Product {
  benefits: any[];
  id: string; // internal DB id
  external_id: string; // provider product id (polar product id)
  provider?: Provider;
  name: string;
  description?: string;
  features?: string[];
  prices: Price[];
  metadata?: Record<string, any>;
}

export interface BillingInvoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  paid_at: number;
  invoice_date: number;
  period_start: number;
  period_end: number;
  pdf_url?: string | null;
}
