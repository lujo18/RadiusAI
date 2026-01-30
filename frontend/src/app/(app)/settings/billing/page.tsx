"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription, useCreatePortal } from "@/lib/api/hooks/useSubscription";
import { Dialog, DialogTrigger, DialogPortal, DialogOverlay, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/animate-ui/primitives/radix/dialog";
import { useUserProfile } from "@/lib/api/hooks/useUser";

export default function BillingPage() {
  const { data: subscription, isLoading } = useSubscription();
  const createPortal = useCreatePortal();
  const { data: user } = useUserProfile();
  const [open, setOpen] = useState(false);

  const plan = subscription?.plan || subscription?.product_name || "Free";
  const postLimit = subscription?.post_limit || "—";
  const quickstart = subscription?.quickstart_included ? "Included" : "Not included";
  const billingEmail = subscription?.billing_email || "Not set";
  let nextPayment: Date | null = null;
  if (subscription?.current_period_end) {
    const v = subscription.current_period_end;
    if (typeof v === 'number') nextPayment = new Date(v * 1000);
    else if (!isNaN(Number(v))) nextPayment = new Date(Number(v) * 1000);
    else nextPayment = new Date(v);
  }
  const amountDue = subscription?.amount_due ? `$${(subscription.amount_due / 100).toFixed(2)}` : subscription?.price || "$0.00";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Billing</h1>
        <p className="text-foreground/60">Manage your subscription and billing settings</p>
      </div>

      <div className="space-y-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
            <CardDescription>Your subscription is active and ready to use</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm text-foreground/70 max-w-md">
                <div>Status:</div>
                <div className="text-foreground">{subscription?.status || 'Inactive'}</div>
                <div>Plan:</div>
                <div className="text-foreground">{plan}</div>
                <div>Post Limit:</div>
                <div className="text-foreground">{postLimit}</div>
                <div>Quickstart Project:</div>
                <div><span className="text-green-400">{quickstart}</span></div>
                <div>Billing email:</div>
                <div className="text-foreground">{billingEmail}</div>
                <div>Next payment:</div>
                <div className="text-foreground">{nextPayment ? nextPayment.toLocaleString() : '—'}</div>
                <div>Amount due:</div>
                <div className="text-foreground">{amountDue}</div>
              </div>

              <div className="w-full md:w-1/3">
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-blue-500 hover:bg-blue-500/90" disabled={!user || createPortal.isPending}>
                      Manage Subscription
                    </Button>
                  </DialogTrigger>
                  <DialogPortal>
                    <DialogOverlay className="fixed inset-0 bg-black/40 z-40" />
                    <DialogContent className="fixed inset-0 z-50 flex items-center justify-center p-4">
                      <div className="w-full max-w-lg bg-card/90 backdrop-blur-md border border-border rounded-lg p-6">
                        <DialogHeader>
                          <DialogTitle>Open Stripe Customer Portal</DialogTitle>
                        </DialogHeader>
                        <div className="py-2">
                          <p className="text-foreground/70">You will be redirected to Stripe to manage your subscription and billing details. Continue?</p>
                        </div>
                        <DialogFooter className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                          <Button
                            onClick={async () => {
                              try {
                                setOpen(false);
                                const res = await createPortal.mutateAsync(user!.id);
                                if (res?.url) {
                                  window.open(res.url, '_blank');
                                }
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            disabled={createPortal.isPending}
                          >
                            Continue
                          </Button>
                        </DialogFooter>
                      </div>
                    </DialogContent>
                  </DialogPortal>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card max-w-2xl">
          <CardHeader>
            <CardTitle>Upcoming Invoice</CardTitle>
            <CardDescription>Your next billing charge scheduled for 2/28/2026</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-foreground/80 py-2">
              <div>1 × Pro 1K (at $10.00 / month)</div>
              <div className="font-medium">$10.00</div>
            </div>
            <div className="border-t border-border/50 mt-4 pt-4 flex items-center justify-between">
              <div className="font-semibold">Total</div>
              <div className="font-semibold">$10.00</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
