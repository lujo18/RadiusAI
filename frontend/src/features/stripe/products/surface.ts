import backendClient from '@/lib/api/clients/backendClient';

export const productApi = {
  async getAll() {
    const { data } = await backendClient.get('/api/billing/products');
    return data;
  },

  async get(productId: string) {
    const { data } = await backendClient.get(`/api/billing/product?product_id=${productId}`);
    return data;
  },
};
