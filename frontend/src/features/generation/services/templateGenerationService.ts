import { backendGenerationClient } from '../clients/backendGenerationClient';

/**
 * Generate template structure (rules, style, content) from a free-text prompt using AI.
 */
export const templateGenerationService = {
  async generateFromPrompt(prompt: string): Promise<any> {
    return await backendGenerationClient.generateTemplateFromPrompt(prompt);
  },
};

export default templateGenerationService;
