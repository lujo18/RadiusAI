import { useMutation, useQueryClient } from '@tanstack/react-query';
import variantGenerationService from '../services/variantGenerationService';
import type { BrandSettings } from '@/lib/validation/brandSchemas';
import type { Post } from '@/types/types';

export function useGenerateVariants() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      templateIds: string[];
      brandSettings: BrandSettings;
      postsPerTemplate: number;
    }) => {
      return await variantGenerationService.generateVariants(
        params.templateIds,
        params.brandSettings,
        params.postsPerTemplate
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['variants'] });
    },
  });
}
