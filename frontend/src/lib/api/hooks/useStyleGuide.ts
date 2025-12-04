// React Query hooks for Style Guide

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { styleGuideApi } from '@/lib/api/client';

// Query Keys
export const styleGuideKeys = {
  all: ['styleGuide'] as const,
};

// ==================== QUERIES ====================

export function useStyleGuide() {
  return useQuery({
    queryKey: styleGuideKeys.all,
    queryFn: styleGuideApi.getStyleGuide,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ==================== MUTATIONS ====================

export function useUpdateStyleGuide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: styleGuideApi.updateStyleGuide,
    onSuccess: (data) => {
      queryClient.setQueryData(styleGuideKeys.all, data);
    },
  });
}
