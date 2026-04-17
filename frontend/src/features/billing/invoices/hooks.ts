import { useQuery } from '@tanstack/react-query';
import type { BillingInvoice } from '@/types/billing';
import { getBillingInvoices } from '@/features/billing/invoices/service';

export const useInvoices = (teamId?: string) => {
  return useQuery<BillingInvoice[]>({
    queryKey: ['billing', 'invoices', teamId ?? 'current'],
    queryFn: () => getBillingInvoices(teamId),
    staleTime: 60 * 1000,
  });
};
