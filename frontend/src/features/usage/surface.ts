import backendClient from '@/lib/api/clients/backendClient';

export const usageApi = {
  async getUsage() {
    const { data } = await backendClient.get('/api/usage');
    return data;
  },

  async consume(productId: string, amount = 1) {
    const { data } = await backendClient.post('/api/usage/consume', { product_id: productId, amount });
    return data;
  },

  async syncPeriod() {
    const { data } = await backendClient.post('/api/usage/sync-period');
    return data;
  },

  async track(metric: string, amount = 1, productId?: string) {
    const { data } = await backendClient.post('/api/usage/track', { metric, amount, product_id: productId });
    return data;
  },

  async trackSlides(count = 1) {
    const { data } = await backendClient.post('/api/usage/track/slides', { count });
    return data;
  },

  async trackAiCredits(amount = 1, action: 'consume' | 'add' = 'consume') {
    const { data } = await backendClient.post('/api/usage/track/ai-credits', { amount, action });
    return data;
  },

  async getBrandUsage() {
    const { data } = await backendClient.get('/api/usage/brands');
    return data;
  },

  async trackBrand() {
    const { data } = await backendClient.post('/api/usage/brands/track');
    return data;
  },

  async getTemplateUsage(brandId?: string) {
    const params = brandId ? `?brand_id=${brandId}` : '';
    const { data } = await backendClient.get(`/api/usage/templates${params}`);
    return data;
  },

  async trackTemplate() {
    const { data } = await backendClient.post('/api/usage/templates/track');
    return data;
  },

  async getCreditsUsage() {
    const { data } = await backendClient.get('/api/usage/credits');
    return data;
  },
};
