// DELETE: Depreciated — Billing UI moved to provider-agnostic components; keep until migration verification.
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download } from "lucide-react";
import { formatDate, formatCurrency } from "@/features/depreciated-stripe/utils/formatting";
import type { BillingInvoice } from '@/types/billing';

interface PaymentHistoryProps {
  invoices: BillingInvoice[];
  isLoading: boolean;
}

export const PaymentHistory = ({ invoices, isLoading }: PaymentHistoryProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
        <CardDescription>Your recent invoices and payments</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-foreground/40" />
          </div>
        ) : invoices && invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-foreground/60 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-foreground/60 font-medium">Amount</th>
                  <th className="text-left py-3 px-4 text-foreground/60 font-medium">Period</th>
                  <th className="text-left py-3 px-4 text-foreground/60 font-medium">Status</th>
                  <th className="text-right py-3 px-4 text-foreground/60 font-medium">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice: BillingInvoice) => (
                  <tr key={invoice.id} className="border-b border-border hover:bg-foreground/5 transition-colors">
                    <td className="py-3 px-4 text-foreground">
                      {formatDate(invoice.paid_at || invoice.invoice_date)}
                    </td>
                    <td className="py-3 px-4 text-foreground font-semibold">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </td>
                    <td className="py-3 px-4 text-foreground/80 text-xs">
                      {invoice.period_start} — {invoice.period_end}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                        Paid
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {invoice.pdf_url ? (
                        <a
                          href={invoice.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download</span>
                        </a>
                      ) : (
                        <span className="text-foreground/40 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-foreground/60">No invoices yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
