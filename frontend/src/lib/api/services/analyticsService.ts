import { AnalyticsRepository } from '@/lib/supabase/repos/AnalyticsRepository';

const analyticsService = {
  // Fetch aggregated analytics for user or brand (delegates to repository)
  async getAnalytics(timeframe: 'day' | 'week' | 'month' = 'week', brandId?: string | null) {
    return await AnalyticsRepository.getAnalytics({ brandId });
  },

  // Get a single post analytics row
  async getPostAnalytics(postId: string) {
    return await AnalyticsRepository.getPostAnalytics(postId);
  },

  // Get analytics history (for charting / trends)
  async getAnalyticsHistory(opts?: { brandId?: string | null; postId?: string; from?: string; to?: string }) {
    return await AnalyticsRepository.getAnalyticsHistory(opts);
  },

  async getVariantPerformance(brandId?: string | null) {
    // Placeholder: repository-level implementation may be added later
    throw new Error('getVariantPerformance not implemented');
  },

  async analyzeAndEvolve() {
    // Placeholder for backend AI analysis call; implement when backend endpoint is available
    throw new Error('analyzeAndEvolve not implemented');
  },
};

export default analyticsService;
