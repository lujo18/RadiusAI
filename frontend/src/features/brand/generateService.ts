/* Compatibility shim for legacy import path.
   Prefer using the feature-based generation service in features/brand.
*/
const brandGenerationService = {
  generate: async (..._args: any[]) => {
    throw new Error('brandGenerationService shim called. Migrate callers to features/brand generation service.');
  },
  generateFromGuideline: async (_guideline: string) => {
    throw new Error('brandGenerationService.generateFromGuideline shim called. Migrate callers to features/brand generation service.');
  },
  generateFromPrompt: async (_prompt: string) => {
    throw new Error('brandGenerationService.generateFromPrompt shim called. Migrate callers to features/brand generation service.');
  },
};

export default brandGenerationService;
