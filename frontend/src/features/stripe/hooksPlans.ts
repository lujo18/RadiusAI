import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { PlansResponse, StripePlan } from '@/lib/api/types/stripe';

export const useStripePlans = () => {
  return useQuery<StripePlan[]>({
    queryKey: ['stripe', 'plans'],
    queryFn: async () => {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await axios.get(`${apiBase}/api/v1/stripe/plans`);
      const data: PlansResponse = res.data;
      return data.plans ?? [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
