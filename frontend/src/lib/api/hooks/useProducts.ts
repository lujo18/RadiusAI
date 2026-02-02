import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/client';
import type { ProductsResponse, ProductResponse } from '@/lib/api/types/stripe';

export const useProducts = () => {
  return useQuery<ProductsResponse>({
    queryKey: ['stripe-products'],
    queryFn: () => productsApi.getProducts(),
  });
};

export const useProduct = (productId: string) => {
  return useQuery<ProductResponse>({
    queryKey: ['stripe-product', productId],
    queryFn: () => productsApi.getProduct(productId),
    enabled: !!productId,
  });
};
