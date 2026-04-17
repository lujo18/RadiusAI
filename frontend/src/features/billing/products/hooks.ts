import { useQuery } from '@tanstack/react-query';
import { productApi } from './surface';

export const useProducts = () => {
  return useQuery({
    queryKey: ['billing', 'products'],
    queryFn: () => productApi.getAll(),
  });
};

export const useProduct = (productId: string) => {
  return useQuery({
    queryKey: ['billing', 'product', productId],
    queryFn: () => productApi.get(productId),
    enabled: !!productId,
  });
};
