import backendClient from '@/lib/api/clients/backendClient';
import type { Product } from '@/types/billing';

export const productApi = {
  async getAll(): Promise<Product[]> {
    console.log("[productApi] calling backend /api/v1/billing/products/")
    const resp = await backendClient.get('/api/v1/billing/products/');
    console.log("[productApi] response from backend:", resp);
    
    // backend may return { products: [...] } or an array directly
    return resp?.data?.products ?? resp?.data ?? [];
  },

  async get(id: string): Promise<Product | null> {
    const resp = await backendClient.get(`/api/v1/billing/products/${id}`);
    return resp?.data ?? null;
  },
};
