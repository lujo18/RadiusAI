import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/client';
import type { ProductsResponse, StripeProduct } from '@/lib/api/types/stripe';

export const useStripeProducts = () => {
  return useQuery<StripeProduct[]>({
    queryKey: ['stripe', 'products'],
    queryFn: async () => {
      const res: ProductsResponse = await productsApi.getProducts();
      return res?.products ?? [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
