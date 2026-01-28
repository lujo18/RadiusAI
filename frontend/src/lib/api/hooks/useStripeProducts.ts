import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { productsApi } from '../client';

export const useStripeProducts = () => {
  return useQuery({
    queryKey: ['stripe', 'products'],
    queryFn: () => productsApi.getProducts(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
