import backendClient from '@/lib/api/clients/backendClient';

/**
 * Brand-related services (connections, integrations)
 * AI generation → use generation layer instead
 */
const brandService = {
  /**
   * Start OAuth flow for social media connection
   */
  async startSocialConnect({
    late_profile_id,
    brand_id,
    platform,
  }: {
    late_profile_id: string;
    brand_id: string;
    platform: string;
  }) {
    const resp = await backendClient.post(`/api/social/connect/${platform}`, {
      existing_profile_id: late_profile_id,
      brand_id,
    });
    return resp.data as { authUrl: string; platform: string; message: string };
  },

  /**
   * Disconnect a social media account
   */
  async disconnectSocialAccount({ integration_id }: { integration_id: string }) {
    const resp = await backendClient.post('/api/social/disconnect', { integration_id });
    return resp.data;
  },

  /**
   * Check connection status (legacy)
   */
  async checkConnectionStatus(connectToken: string) {
    const resp = await backendClient.get(`/connect-social/status/${connectToken}`);
    return resp.data;
  },

  /**
   * Cancel connection attempt (legacy)
   */
  async cancelConnection(connectToken: string) {
    const resp = await backendClient.delete(`/connect-social/cancel/${connectToken}`);
    return resp.data;
  },
};

export default brandService;
