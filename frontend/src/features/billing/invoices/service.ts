import backendClient from '@/lib/api/clients/backendClient';
import { BillingInvoicesResponseSchema } from '@/lib/validation/billingInvoices';
import type { BillingInvoice } from '@/types/billing';

export async function getBillingInvoices(teamId?: string): Promise<BillingInvoice[]> {
  const response = await backendClient.get('/api/v1/billing/invoices', {
    params: teamId ? { team_id: teamId } : undefined,
  });

  const parsed = BillingInvoicesResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    console.error('[billing/invoices] invalid response payload', parsed.error.flatten());
    return [];
  }

  return parsed.data.invoices;
}
