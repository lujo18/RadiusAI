import analyticsService from '@/lib/api/services/analyticsService';
import { AnalyticsRepository } from '@/lib/supabase/repos/AnalyticsRepository';

export const analyticsApi = {
  getAnalytics: async (timeframe: 'day' | 'week' | 'month' = 'week', brandId?: string | null) => {
    return await analyticsService.getAnalytics(timeframe, brandId);
  },

  getVariantPerformance: async (brandId?: string | null) => {
    return await analyticsService.getVariantPerformance(brandId);
  },

  analyzeAndEvolve: async () => {
    return await analyticsService.analyzeAndEvolve();
  },

  // Direct repository helpers (thin proxy)
  updatePostAnalytics: async (postId: string, analyticsData: any) => {
    return await AnalyticsRepository.updatePostAnalytics(postId, analyticsData);
  },
};

export default analyticsApi;
