import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/client';

export const useProducts = () => {
  return useQuery({
    queryKey: ['stripe-products'],
    queryFn: () => productsApi.getProducts(),
  });
};

export const useProduct = (productId: string) => {
  return useQuery({
    queryKey: ['stripe-product', productId],
    queryFn: () => productsApi.getProduct(productId),
    enabled: !!productId,
  });
};
