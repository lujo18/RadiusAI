import { useMutation } from '@tanstack/react-query';
import brandGenerationService from '../services/brandGenerationService';
import type { BrandSettings } from '@/lib/validation/brandSchemas';

export function useGenerateBrand() {
  return useMutation({
    mutationFn: async (guideline: string) => {
      return await brandGenerationService.generateFromGuideline(guideline);
    },
  });
}
