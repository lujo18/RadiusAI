// Thin service layer for Analytics feature
import { AnalyticsRepository } from "./repo";
import type { AnalyticTimeframes, AnalyticSections } from "./types";

export const analyticsService = {
  getAnalytics: (
    timeframe: AnalyticTimeframes,
    section: AnalyticSections,
    brandId?: string | null,
    postId?: string | null,
  ) => {
    if (brandId) {
      return AnalyticsRepository.getBrandAnalyticsHistory(timeframe, section, brandId);
    }
    else if (postId) {
      return AnalyticsRepository.getPostAnalyticsHistory(timeframe, section, postId);
    }
  }
  // getVariantPerformance: (brandId?: string | null) =>
  //   analyticsApi.getVariantPerformance(brandId),
  // analyzeAndEvolve: () => analyticsApi.analyzeAndEvolve(),
};
