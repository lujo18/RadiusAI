"use client";

import React, { useState } from "react";
import { usePlans, useCreatePlan, useUpdatePlan, useDeletePlan } from '@/features/stripe/plans/hooks';
import { productRateLimitsApi } from '@/features/stripe/plans/surface';
import { useStripeProducts } from '@/features/stripe/hooksProducts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/animate-ui/components/radix/dialog";
import { Trash2, Edit2, Plus, Loader2 } from "lucide-react";
import type { Database } from "@/types/database";

type Plan = {
  id: string;
  plan_id: string;
  name: string;
  max_brands: number | null;
  max_posts_per_month: number | null;
  max_slides_per_month: number | null;
  ai_credits?: number | null;
  rules?: string;
};

export default function PricingPage() {
  const { data: plans = [], isLoading } = usePlans();
  const { data: stripeProducts = [], isLoading: productsLoading } = useStripeProducts();
  const createMutation = useCreatePlan();
  const updateMutation = useUpdatePlan();
  const deleteMutation = useDeletePlan();


  const [open, setOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    plan_id: "",
    name: "",
    max_brands: null as number | null,
    max_posts_per_month: null as number | null,
    max_slides_per_month: null as number | null,
    ai_credits: null as number | null,
    rules: '' as string,
  });

  const handleOpen = async (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan);
      // load matching product_rate_limits rules if present
      let rulesText = '';
      try {
        const limitRes = await productRateLimitsApi.get(plan.plan_id);
        if (limitRes && limitRes.rules) {
          rulesText = typeof limitRes.rules === 'string' ? limitRes.rules : JSON.stringify(limitRes.rules, null, 2);
        }
      } catch (e) {
        // ignore
      }

      setFormData({
        plan_id: plan.plan_id,
        name: plan.name ?? "",
        max_brands: plan.max_brands,
        max_posts_per_month: plan.max_posts_per_month,
        max_slides_per_month: plan.max_slides_per_month,
          ai_credits: (plan as any).ai_credits ?? null,
          rules: rulesText,
      });
    } else {
      setEditingPlan(null);
      setFormData({
        plan_id: "",
        name: "",
        max_brands: null,
        ai_credits: null,
        max_posts_per_month: null,
        max_slides_per_month: null,
        rules: '',
      });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingPlan) {
        await updateMutation.mutateAsync({
          planId: editingPlan.plan_id,
          updates: {
            name: formData.name,
            max_brands: formData.max_brands,
              ai_credits: formData.ai_credits,
            max_posts_per_month: formData.max_posts_per_month,
            max_slides_per_month: formData.max_slides_per_month,
          },
        });
        // upsert product rate limits rules
        try {
          const parsed = formData.rules ? JSON.parse(formData.rules) : null;
          await productRateLimitsApi.upsert(editingPlan.plan_id, parsed);
        } catch (e) {
          console.warn('Failed to upsert product rate limits', e);
        }
      } else {
        await createMutation.mutateAsync({
          plan_id: formData.plan_id,
          name: formData.name,
          max_brands: formData.max_brands,
            ai_credits: formData.ai_credits,
          max_posts_per_month: formData.max_posts_per_month,
          max_slides_per_month: formData.max_slides_per_month,
        });
        // create product_rate_limits row if rules provided
        try {
          const parsed = formData.rules ? JSON.parse(formData.rules) : null;
          if (parsed) await productRateLimitsApi.upsert(formData.plan_id, parsed);
        } catch (e) {
          console.warn('Failed to create product rate limits', e);
        }
      }
      setOpen(false);
    } catch (error) {
      console.error("Failed to save plan:", error);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!window.confirm("Are you sure you want to delete this plan?")) return;
    try {
      await deleteMutation.mutateAsync(planId);
    } catch (error) {
      console.error("Failed to delete plan:", error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Pricing Plans</h1>
          <p className="text-foreground/60">Manage subscription plans and rate limits</p>
        </div>
        <Button
              onClick={() => handleOpen()}
              className="bg-primary hover:bg-primary/80"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Plan
            </Button>
        
      </div>

      {/* Plans Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Plans Overview</CardTitle>
          <CardDescription>
            {plans.length} plan{plans.length !== 1 ? "s" : ""} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-8 text-foreground/50">
              No plans created yet. Create your first plan to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead>Stripe Product ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Max Brands</TableHead>
                    <TableHead>Max Posts/Month</TableHead>
                    <TableHead>Max Slides/Month</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan: any) => {
                    const stripeProduct = stripeProducts.find((p: any) => p.id === plan.plan_id);
                    return (
                      <TableRow key={plan.plan_id} className="border-border/50">
                        <TableCell className="font-mono text-sm">
                          <div className="flex flex-col gap-1">
                            <span>{plan.plan_id}</span>
                            {stripeProduct && (
                              <span className="text-xs text-foreground/60">
                                {stripeProduct.name}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{plan.name}</TableCell>
                        <TableCell>
                          {plan.max_brands ?? (
                            <span className="text-foreground/50">Unlimited</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {plan.max_posts_per_month ?? (
                            <span className="text-foreground/50">Unlimited</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {plan.max_slides_per_month ?? (
                            <span className="text-foreground/50">Unlimited</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpen(plan)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(plan.plan_id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>


      <Dialog open={open} onOpenChange={setOpen}>
          
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? "Edit Plan" : "Create New Plan"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <p></p>

                <Label htmlFor="stripe-product">Stripe Product *</Label>
                <Select value={formData.plan_id} onValueChange={(value) => {
                  const selectedProduct = stripeProducts.find((p: any) => p.id === value);
                  setFormData({ 
                    ...formData, 
                    plan_id: value,
                    name: selectedProduct?.name || formData.name
                  });
                }}>
                  <SelectTrigger id="stripe-product">
                    <SelectValue placeholder={productsLoading ? "Loading products..." : "Select a Stripe product"} />
                  </SelectTrigger>
                  <SelectContent>
                    {stripeProducts.map((product: any) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-foreground/50 mt-1">
                  Products are synced from your Stripe account
                </p>
              </div>
              <div>
                <Label htmlFor="plan-name">Plan Name</Label>
                <Input
                  id="plan-name"
                  placeholder="e.g., Pro Plan"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="max-brands">Max Brands (null = unlimited)</Label>
                <Input
                  id="max-brands"
                  type="number"
                  placeholder="e.g., 5"
                  value={formData.max_brands ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_brands: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="ai-credits">AI Credits/Month (null = unlimited)</Label>
                <Input
                  id="ai-credits"
                  type="number"
                  placeholder="e.g., 1000"
                  value={formData.ai_credits ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ai_credits: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="max-posts">Max Posts/Month</Label>
                <Input
                  id="max-posts"
                  type="number"
                  placeholder="e.g., 100"
                  value={formData.max_posts_per_month ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_posts_per_month: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="max-slides">Max Slides/Month</Label>
                <Input
                  id="max-slides"
                  type="number"
                  placeholder="e.g., 500"
                  value={formData.max_slides_per_month ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_slides_per_month: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="rules">Rules (JSON)</Label>
                <textarea
                  id="rules"
                  className="w-full rounded-md border border-border bg-background p-2 text-sm"
                  rows={6}
                  value={formData.rules}
                  onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                />
                <p className="text-xs text-foreground/50 mt-1">Optional JSON rules for product rate limits. Example: {`{ "rules": [{ "metric": "slides_generated", "limit": 500 }] }`}</p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  createMutation.isPending ||
                  updateMutation.isPending ||
                  !formData.plan_id ||
                  !formData.name ||
                  productsLoading
                }
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Plan"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
