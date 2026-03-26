export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  paid_at: number;
  invoice_date: number;
  period_start: number;
  period_end: number;
  pdf_url: string;
}