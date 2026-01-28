import apiClient from '@/lib/api/client';

export type GuidelineRequest = {
  guideline_prompt: string;
};

export const brandApi = {
  generateBrandSettings: async (guideline_prompt: string) => {
    const resp = await apiClient.post('/api/brand/generate', { guideline_prompt });
    if (resp.status !== 200) {
      throw new Error(`Brand generation failed: ${resp.statusText}`);
    }
    return resp.data;
  },
};

export default brandApi;
