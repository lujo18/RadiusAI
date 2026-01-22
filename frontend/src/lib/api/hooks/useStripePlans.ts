import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const useStripePlans = () => {
  return useQuery({
    queryKey: ['stripe', 'plans'],
    queryFn: async () => {
      const res = await axios.get('/api/stripe/plans');
      // API returns { plans: [...] }
      return res.data.plans;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
