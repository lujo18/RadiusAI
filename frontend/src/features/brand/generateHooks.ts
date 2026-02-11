import { useMutation } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import brandGenerationService from '@/features/brand/generateService';

export type BrandSettingsData = {
  niche?: string;
  aesthetic?: string;
  target_audience?: string;
  brand_voice?: string;
  content_pillars?: string[];
  tone_of_voice?: string | null;
  emoji_usage?: string | null;
  forbidden_words?: string[];
  preferred_words?: string[];
  hashtag_style?: string | null;
  hashtag_count?: number | null;
  hashtags?: string[] | null;
  // allow additional fields
  [key: string]: any;
};

async function generateBrandRequest(guideline_prompt: string): Promise<BrandSettingsData> {
  const data = await brandGenerationService.generateFromGuideline(guideline_prompt);
  return data as BrandSettingsData;
}

export function useGenerateBrandSettings(options?: {
  onSuccess?: (data: BrandSettingsData) => void;
  onError?: (err: unknown) => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation<BrandSettingsData, Error, string>({
    mutationFn: (guideline_prompt: string) => generateBrandRequest(guideline_prompt),
    retry: 1,
    onSuccess(data) {
      // Invalidate or refetch brand-related queries if needed
      // queryClient.invalidateQueries(['brands']);
      options?.onSuccess?.(data);
    },
    onError(err) {
      options?.onError?.(err);
    },
  });

  // Provide `isPending` alias used across the codebase (matches other hooks)
  return {
    ...mutation,
    isPending: (mutation as any).isPending ?? (mutation as any).isLoading ?? false,
  } as any;
}

