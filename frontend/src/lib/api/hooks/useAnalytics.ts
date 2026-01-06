// React Query hooks for Analytics

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/client';

// Query Keys
export const analyticsKeys = {
  all: ['analytics'] as const,
  byTimeframe: (timeframe: string, brandId?: string | null) => ['analytics', timeframe, brandId] as const,
  variants: (brandId?: string | null) => ['analytics', 'variants', brandId] as const,
};

// ==================== QUERIES ====================

export function useAnalytics(timeframe: 'day' | 'week' | 'month' = 'week', brandId?: string | null) {
  return useQuery({
    queryKey: analyticsKeys.byTimeframe(timeframe, brandId),
    queryFn: () => analyticsApi.getAnalytics(timeframe, brandId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
}

export function useVariantPerformance(brandId?: string | null) {
  return useQuery({
    queryKey: analyticsKeys.variants(brandId),
    queryFn: () => analyticsApi.getVariantPerformance(brandId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ==================== MUTATIONS ====================

export function useAnalyzeAndEvolve() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: analyticsApi.analyzeAndEvolve,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
    },
  });
}
