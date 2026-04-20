import { z } from 'zod';

export const BillingInvoiceSchema = z.object({
  id: z.string(),
  amount: z.number().int(),
  currency: z.string(),
  status: z.string(),
  created: z.number().int(),
  paid_at: z.number().int(),
  invoice_date: z.number().int(),
  period_start: z.number().int(),
  period_end: z.number().int(),
  pdf_url: z.string().nullable().optional(),
});

export const BillingInvoicesResponseSchema = z.object({
  invoices: z.array(BillingInvoiceSchema).default([]),
  total: z.number().int().nonnegative().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

export type BillingInvoicePayload = z.infer<typeof BillingInvoiceSchema>;
