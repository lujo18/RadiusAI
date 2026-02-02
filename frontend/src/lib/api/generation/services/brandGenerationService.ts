import { backendGenerationClient } from '../clients/backendGenerationClient';
import type { BrandSettings } from '@/lib/validation/brandSchemas';

/**
 * Generate brand settings from free-text guidelines using AI.
 */
export const brandGenerationService = {
  async generateFromGuideline(guideline: string): Promise<BrandSettings> {
    return await backendGenerationClient.generateBrandSettings(guideline);
  },
};

export default brandGenerationService;
