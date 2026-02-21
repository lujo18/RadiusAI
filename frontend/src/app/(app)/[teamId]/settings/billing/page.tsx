"use client";

import React from "react";
import { useSubscription, useCreatePortal } from '@/features/subscription/hooks';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import backendClient from "@/lib/api/clients/backendClient";

interface Invoice {
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

async function fetchInvoices() {
  const response = await backendClient.get('/api/billing/invoices');
  return response.data.invoices;
}

export default function BillingPage() {
  console.log("Loaded billing page")
  const { data: subscription, isLoading, error } = useSubscription();
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['billing', 'invoices'],
    queryFn: fetchInvoices,
  });
  const createPortalMutation = useCreatePortal();

  const handleOpenPortal = async () => {
    try {
      const result = await createPortalMutation.mutateAsync('');
      if (result?.url) {
        window.open(result.url, '_blank');
      }
    } catch (err) {
      console.error('Failed to open portal:', err);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'trialing':
        return 'bg-green-500';
      case 'past_due':
        return 'bg-yellow-500';
      case 'canceled':
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (timestamp: number | string | null) => {
    if (!timestamp) return 'N/A';
    const ts = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
    return new Date(ts * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number | null, currency: string) => {
    if (amount === null || amount === undefined) return '$0.00';
    const formatted = (amount / 100).toFixed(2);
    const symbol = currency?.toLowerCase() === 'usd' ? '$' : '';
    return `${symbol}${formatted}`;
  };

  const subscriptionItem = subscription?.items?.data?.[0];
  const productInfo = subscriptionItem?.price?.product;
  const planName = productInfo?.name || 'No Plan';
  const planDescription = productInfo?.description || '';
  const monthlyPrice = (subscription as any)?.amount_due_display || '$0.00';
  const currency = (subscription as any)?.currency || 'USD';
  const status = (subscription as any)?.status || 'inactive';
  const nextBillingDate = formatDate((subscription as any)?.current_period_end);

  console.log("SUB", subscription)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Billing</h1>
        <p className="text-foreground/60">
          Manage your subscription and billing settings
        </p>
      </div>

      {isLoading ? (
        <Card className="max-w-2xl">
          <CardContent className="pt-6">
            <p className="text-foreground/60">Loading subscription information...</p>
          </CardContent>
        </Card>
      ) : subscription ? (
        <Card className="max-w-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{planName}</CardTitle>
                <CardDescription>{planDescription}</CardDescription>
              </div>
              <Badge className={getStatusBadgeColor(status)}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Price Section */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-foreground/60 mb-1">Monthly Price</p>
                <p className="text-2xl font-bold text-foreground">{monthlyPrice}</p>
                <p className="text-xs text-foreground/50">per month in {currency}</p>
              </div>
              <div>
                <p className="text-sm text-foreground/60 mb-1">Next Billing Date</p>
                <p className="text-lg font-semibold text-foreground">{nextBillingDate}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-border">
              <Button
                onClick={handleOpenPortal}
                disabled={createPortalMutation.isPending || !subscription}
                className="w-full"
                variant="default"
              >
                {createPortalMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opening Subscription Manager...
                  </>
                ) : (
                  'Manage Subscription in Stripe'
                )}
              </Button>
              <p className="text-xs text-foreground/50 mt-3 text-center">
                Update payment methods, adjust billing frequency, or manage subscriptions
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-2xl">
          <CardContent className="pt-6">
            <p className="text-foreground/60 mb-4">No active subscription found.</p>
            <Button variant="default">Browse Plans</Button>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Your recent invoices and payments</CardDescription>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
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
                  {invoices.map((invoice: Invoice) => (
                    <tr key={invoice.id} className="border-b border-border hover:bg-foreground/5 transition-colors">
                      <td className="py-3 px-4 text-foreground">
                        {formatDate(invoice.paid_at || invoice.invoice_date)}
                      </td>
                      <td className="py-3 px-4 text-foreground font-semibold">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </td>
                      <td className="py-3 px-4 text-foreground/80 text-xs">
                        {formatDate(invoice.period_start)} — {formatDate(invoice.period_end)}
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
    </div>
  );
}
