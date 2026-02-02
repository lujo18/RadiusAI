import { backendGenerationClient } from '../clients/backendGenerationClient';
import type { BrandSettings } from '@/lib/validation/brandSchemas';
import type { Post } from '@/types/types';

/**
 * A/B test variant generation for comparing multiple templates.
 */
export const variantGenerationService = {
  async generateVariants(
    templateIds: string[],
    brandSettings: BrandSettings,
    postsPerTemplate: number
  ): Promise<Record<string, Post[]>> {
    return await backendGenerationClient.generateVariants({
      templateIds,
      brandSettings,
      postsPerTemplate,
    });
  },
};

export default variantGenerationService;
