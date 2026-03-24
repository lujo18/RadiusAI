import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import postGenerationService from '../services/postGenerationService';
import type { Database } from '@/types/database';
import type { BrandSettings } from '@/lib/validation/brandSchemas';
import type { Post } from '@/types/types';
import { postKeys } from '@/features/posts/hooks';

export function useGeneratePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      template: Database['public']['Tables']['templates']['Row'];
      brandSettings: BrandSettings;
      brandId: string;
      count?: number;
    }) => {
      return await postGenerationService.generateFromTemplate(
        params.template,
        params.brandSettings,
        params.count
      );
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: postKeys.allForBrand(variables.brandId) });
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
      stock_pack_directory?: string;
      count?: number;
    }) => {
      return await postGenerationService.generateFromTemplateAuto(
        params.template,
        params.brandSettings,
        params.brandId,
        params.count,
        params.ctaId,
        params.stock_pack_directory
      );
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: postKeys.allForBrand(variables.brandId) });
    },
  });
}
