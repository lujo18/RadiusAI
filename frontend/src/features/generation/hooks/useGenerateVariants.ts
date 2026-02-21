import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import variantGenerationService from '../services/variantGenerationService';
import type { BrandSettings } from '@/lib/validation/brandSchemas';
import type { Post } from '@/types/types';
import { postKeys } from '@/features/posts/hooks';

export function useGenerateVariants() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      templateIds: string[];
      brandSettings: BrandSettings;
      brandId: string;
      postsPerTemplate: number;
    }) => {
      return await variantGenerationService.generateVariants(
        params.templateIds,
        params.brandSettings,
        params.postsPerTemplate
      );
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: postKeys.allForBrand(variables.brandId) });
      queryClient.invalidateQueries({ queryKey: ['variants'] });
    },
  });
}
