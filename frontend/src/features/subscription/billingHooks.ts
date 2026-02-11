import { useCallback, useState } from 'react';
import apiClient from '@/lib/api/client';

interface UseBillingState {
  loading: boolean;
  error: string | null;
}

export function useBilling({ baseUrl }: { baseUrl?: string } = {}) {
  const resolvedBaseUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || '';

  const [state, setState] = useState<UseBillingState>({
    loading: false,
    error: null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState((p) => ({ ...p, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((p) => ({ ...p, error }));
  }, []);

  const handleAsync = useCallback(
    async <T,>(op: () => Promise<T>, name = 'operation') => {
      try {
        setLoading(true);
        setError(null);
        const res = await op();
        return res as T;
      } catch (err: any) {
        const message = err?.message || `Failed to ${name}`;
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError]
  );

  const fetchProducts = useCallback(async () => {
    return handleAsync(() => apiClient.get('/api/billing/products').then((r) => r.data), 'fetch products');
  }, [handleAsync]);

  const fetchProduct = useCallback(async (product_id: string) => {
    return handleAsync(() => apiClient.get(`/api/billing/product?product_id=${product_id}`).then((r) => r.data), 'fetch product');
  }, [handleAsync]);

  const fetchCustomer = useCallback(async (customer_id: string) => {
    return handleAsync(() => apiClient.get(`/api/billing/customer?customer_id=${customer_id}`).then((r) => r.data), 'fetch customer');
  }, [handleAsync]);

  const fetchCustomerSubscriptions = useCallback(async (customer_id: string) => {
    return handleAsync(() => apiClient.get(`/api/billing/customer/subscriptions?customer_id=${customer_id}`).then((r) => r.data), 'fetch customer subscriptions');
  }, [handleAsync]);

  const fetchCustomerPayments = useCallback(async (customer_id: string) => {
    return handleAsync(() => apiClient.get(`/api/billing/customer/payments?customer_id=${customer_id}`).then((r) => r.data), 'fetch customer payments');
  }, [handleAsync]);

  const createNewCustomer = useCallback(async (customer: { email: string; name: string; phone_number?: string | null }) => {
    return handleAsync(() => apiClient.post('/api/billing/customer', customer).then((r) => r.data), 'create customer');
  }, [handleAsync]);

  const updateExistingCustomer = useCallback(async (customer_id: string, customer: { name?: string | null; phone_number?: string | null }) => {
    return handleAsync(() => apiClient.put(`/api/billing/customer?customer_id=${customer_id}`, customer).then((r) => r.data), 'update customer');
  }, [handleAsync]);

  const createCheckout = useCallback(async (payload: any) => {
    return handleAsync(() => apiClient.post('/api/billing/checkout', payload).then((r) => r.data), 'create checkout');
  }, [handleAsync]);

  const createPortal = useCallback(async (payload: any) => {
    return handleAsync(() => apiClient.post('/api/billing/portal', payload).then((r) => r.data), 'create portal');
  }, [handleAsync]);

  return {
    loading: state.loading,
    error: state.error,
    fetchProducts,
    fetchProduct,
    fetchCustomer,
    fetchCustomerSubscriptions,
    fetchCustomerPayments,
    createNewCustomer,
    updateExistingCustomer,
    createCheckout,
    createPortal,
  };
}

export default useBilling;
