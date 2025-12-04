// React Query hooks for Analytics

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/client';

// Query Keys
export const analyticsKeys = {
  all: ['analytics'] as const,
  byTimeframe: (timeframe: string) => ['analytics', timeframe] as const,
  variants: ['analytics', 'variants'] as const,
};

// ==================== QUERIES ====================

export function useAnalytics(timeframe: 'day' | 'week' | 'month' = 'week') {
  return useQuery({
    queryKey: analyticsKeys.byTimeframe(timeframe),
    queryFn: () => analyticsApi.getAnalytics(timeframe),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
}

export function useVariantPerformance() {
  return useQuery({
    queryKey: analyticsKeys.variants,
    queryFn: analyticsApi.getVariantPerformance,
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
