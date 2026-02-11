import { useMutation, useQueryClient } from '@tanstack/react-query';
import postGenerationService from '../services/postGenerationService';
import type { Database } from '@/types/database';
import type { BrandSettings } from '@/lib/validation/brandSchemas';
import type { Post } from '@/types/types';

export function useGeneratePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      template: Database['public']['Tables']['templates']['Row'];
      brandSettings: BrandSettings;
      count?: number;
    }) => {
      return await postGenerationService.generateFromTemplate(
        params.template,
        params.brandSettings,
        params.count
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useGeneratePostFromPrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      template: Database['public']['Tables']['templates']['Row'];
      brandSettings: BrandSettings;
      brandId: string;
      ctaId?: string;
      count?: number;
    }) => {
      return await postGenerationService.generateFromTemplateAuto(
        params.template,
        params.brandSettings,
        params.brandId,
        params.count,
        params.ctaId
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
