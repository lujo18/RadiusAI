import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usageApi } from '@/features/usage/surface';

export const useUsage = () => {
  return useQuery({
    queryKey: ['usage', 'user_activity'],
    queryFn: async () => {
      const res = await usageApi.getUsage();
      // return full response so callers can access limits + usage row
      return res ?? { usage: null, limits: [] };
    },
    staleTime: 30 * 1000,
  });
};

export const useConsume = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, amount }: { productId: string; amount?: number }) => {
      const res = await usageApi.consume(productId, amount ?? 1);
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usage', 'user_activity'] });
    },
  });
};

export const useSyncPeriod = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await usageApi.syncPeriod();
      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usage', 'user_activity'] }),
  });
};

export const useTrack = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ metric, amount, productId }: { metric: string; amount?: number; productId?: string }) => {
      const res = await usageApi.track(metric, amount ?? 1, productId);
      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usage', 'user_activity'] }),
  });
};

export const useTrackSlides = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (count: number) => {
      const res = await usageApi.trackSlides(count);
      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usage', 'user_activity'] }),
  });
};

export const useAiCredits = () => {
  const qc = useQueryClient();
  return {
    add: useMutation({
      mutationFn: async (amount: number) => {
        const res = await usageApi.trackAiCredits(amount, 'add');
        return res;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ['usage', 'user_activity'] }),
    }),
    consume: useMutation({
      mutationFn: async (amount: number) => {
        const res = await usageApi.trackAiCredits(amount, 'consume');
        return res;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ['usage', 'user_activity'] }),
    }),
  };
};

export const useGetBrandUsage = () => {
  return useQuery({
    queryKey: ['usage', 'brands'],
    queryFn: async () => {
      const res = await usageApi.getBrandUsage();
      return res ?? { brand_count: 0, brand_limit: null, remaining: null };
    },
    staleTime: 30 * 1000,
  });
};

export const useTrackBrand = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await usageApi.trackBrand();
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usage', 'brands'] });
      qc.invalidateQueries({ queryKey: ['usage', 'user_activity'] });
    },
  });
};

export const useGetTemplateUsage = () => {
  return useQuery({
    queryKey: ['usage', 'templates'],
    queryFn: async () => {
      const res = await usageApi.getTemplateUsage();
      return res ?? { template_count: 0, template_limit: null, remaining: null };
    },
    staleTime: 30 * 1000,
  });
};

export const useTrackTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await usageApi.trackTemplate();
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usage', 'templates'] });
      qc.invalidateQueries({ queryKey: ['usage', 'user_activity'] });
    },
  });
};

export const useGetCreditsUsage = () => {
  return useQuery({
    queryKey: ['usage', 'credits'],
    queryFn: async () => {
      const res = await usageApi.getCreditsUsage();
      return res ?? { credits_used: 0, credits_limit: null };
    },
    staleTime: 30 * 1000,
  });
};

export default useUsage;
