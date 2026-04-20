// DELETE: Depreciated — Stripe-specific product surface. Use `features/billing/products/surface.ts` instead.
import backendClient from '@/lib/api/clients/backendClient';

export const productApi = {
  async getAll() {
    const { data } = await backendClient.get('/api/v1/billing/products');
    return data;
  },

  async get(productId: string) {
    const { data } = await backendClient.get(`/api/v1/billing/product?product_id=${productId}`);
    return data;
  },
};
