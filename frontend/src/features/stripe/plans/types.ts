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