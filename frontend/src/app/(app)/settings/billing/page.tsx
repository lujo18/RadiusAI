"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function BillingPage() {
  // Placeholder data; wire to billing API as needed
  const plan = "Pro";
  const postLimit = "1,000 posts";
  const quickstart = "Included";
  const billingEmail = "Not set";

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
                <div className="text-foreground">Active</div>
                <div>Plan:</div>
                <div className="text-foreground">{plan}</div>
                <div>Post Limit:</div>
                <div className="text-foreground">{postLimit}</div>
                <div>Quickstart Project:</div>
                <div><span className="text-green-400">{quickstart}</span></div>
                <div>Billing email:</div>
                <div className="text-foreground">{billingEmail}</div>
              </div>

              <div className="w-full md:w-1/3">
                <Button className="w-full bg-blue-500 hover:bg-blue-500/90">Manage Subscription</Button>
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
