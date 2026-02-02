import { backendGenerationClient } from '../clients/backendGenerationClient';
import type { Database } from '@/types/database';
import type { BrandSettings } from '@/lib/validation/brandSchemas';
import type { Post } from '@/types/types';

/**
 * Generate posts from template + brand settings.
 * Orchestrates prompt building and backend API calls.
 */
export const postGenerationService = {
  /**
   * Generate from template (structured generation)
   */
  async generateFromTemplate(
    template: Database['public']['Tables']['templates']['Row'],
    brandSettings: BrandSettings,
    count: number = 1
  ): Promise<Post[]> {
    return await backendGenerationClient.generatePostsFromTemplate({
      templateId: template.id,
      brandSettings,
      count,
    });
  },

  /**
   * Generate from template with auto layout selection
   * (uses backend's /api/generate/post/auto endpoint)
   */
  async generateFromTemplateAuto(
    template: Database['public']['Tables']['templates']['Row'],
    brandSettings: BrandSettings,
    brandId: string,
    count: number = 1,
    ctaId?: string
  ): Promise<Post[]> {
    return await backendGenerationClient.generatePostsFromPrompt({
      template,
      brandSettings,
      brandId,
      count,
      ctaId,
    });
  },

  /**
   * Generate A/B test variants
   */
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

export default postGenerationService;
