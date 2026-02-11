// Feature-scoped React Query hooks for Analytics

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { analyticsService } from "./services";
import type { AnalyticTimeframes, AnalyticSections } from "./types";

// Query Keys
export const analyticsKeys = {
  all: ["analytics"] as const,
  byTimeframe: (timeframe: AnalyticTimeframes, section: AnalyticSections, brandId?: string | null, postId?: string | null) =>
    ["analytics", timeframe, brandId, postId, section] as const,
  variants: (brandId?: string | null) =>
    ["analytics", "variants", brandId] as const,
};

// ==================== QUERIES ====================

export function useAnalytics(
  timeframe: AnalyticTimeframes = "7d",
  section: AnalyticSections = "recent",
  brandId?: string | null,
  postId?: string | null,
) {
  return useQuery({
    queryKey: analyticsKeys.byTimeframe(timeframe, section, brandId, postId),
    queryFn: async () => {
      const res = await analyticsService.getAnalytics(timeframe, section, brandId, postId);
      return res ?? null;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
}

// export function useVariantPerformance(brandId?: string | null) {
//   return useQuery({
//     queryKey: analyticsKeys.variants(brandId),
//     queryFn: () => analyticsService.getVariantPerformance(brandId),
//     staleTime: 5 * 60 * 1000, // 5 minutes
//   });
// }

// // ==================== MUTATIONS ====================

// export function useAnalyzeAndEvolve() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: analyticsService.analyzeAndEvolve,
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
//     },
//   });
// }
