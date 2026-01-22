import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const useStripeProducts = () => {
  return useQuery({
    queryKey: ['stripe', 'products'],
    queryFn: async () => {
      const res = await axios.get('/api/stripe/products');
      // API returns { products: [...] }
      return res.data.products;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
