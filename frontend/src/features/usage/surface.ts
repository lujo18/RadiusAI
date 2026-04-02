import backendClient from '@/lib/api/clients/backendClient';

export const usageApi = {
  async getUsage(team_id: string) {
    const { data } = await backendClient.get(`/api/v1/billing/meter/team/${team_id}/credits`);
    return data;
  },

  async consume(team_id: string, productId: string, amount = 1) {
    const { data } = await backendClient.post(`/api/v1/usage/meter/${team_id}/consume`, { product_id: productId, amount });
    return data;
  },

  async syncPeriod() {
    const { data } = await backendClient.post('/api/v1/usage/sync-period');
    return data;
  },

  async track(metric: string, amount = 1, productId?: string) {
    const { data } = await backendClient.post('/api/v1/usage/track', { metric, amount, product_id: productId });
    return data;
  },

  async trackSlides(count = 1) {
    const { data } = await backendClient.post('/api/v1/usage/track/slides', { count });
    return data;
  },

  async trackAiCredits(amount = 1, action: 'consume' | 'add' = 'consume') {
    const { data } = await backendClient.post('/api/v1/usage/track/ai-credits', { amount, action });
    return data;
  },

  async getBrandUsage() {
    const { data } = await backendClient.get('/api/v1/usage/brands');
    return data;
  },

  async trackBrand() {
    const { data } = await backendClient.post('/api/v1/usage/brands/track');
    return data;
  },

  async getTemplateUsage(brandId?: string) {
    const params = brandId ? `?brand_id=${brandId}` : '';
    const { data } = await backendClient.get(`/api/v1/usage/templates${params}`);
    return data;
  },

  async trackTemplate() {
    const { data } = await backendClient.post('/api/v1/usage/templates/track');
    return data;
  },

  async getCreditsUsage() {
    const { data } = await backendClient.get('/api/v1/usage/credits');
    return data;
  },
};
