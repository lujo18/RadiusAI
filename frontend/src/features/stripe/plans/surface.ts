import backendClient from '@/lib/api/clients/backendClient';

export const productRateLimitsApi = {
  async getAll() {
    const { data } = await backendClient.get('/api/product_rate_limits');
    return data;
  },

  async get(productId: string) {
    const { data } = await backendClient.get(`/api/product_rate_limits/${productId}`);
    return data;
  },

  async upsert(productId: string, rules: any) {
    const { data } = await backendClient.post(`/api/product_rate_limits/${productId}`, rules);
    return data;
  },
};
