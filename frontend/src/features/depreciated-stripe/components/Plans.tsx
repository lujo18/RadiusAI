// DELETE: Depreciated — Replaced by `components/billing/PricingCard` + `components/billing/PricingSection`.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Crown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLAN_ORDER, isUpgrade as isPlanUpgrade, type PlanKey } from "@/lib/plans";
import { pricingContent } from "@/content/pricing";

interface PlansProps {
  productByPlanKey: Map<PlanKey, any>;
  upgradeByPlanKey: Map<PlanKey, any>;
  currentPlanKey: PlanKey | null;
  highlightUpgrade: boolean;
  PLAN_HIGHLIGHT: PlanKey;
  formatCurrencyAmount: (amount: number, currency: string) => string;
  subscription: any;
  switchingPlan: string | null;
  handleSwitchPlan: (priceId: string, productId: string) => void;
  handleCheckout: (planKey: PlanKey) => void;
  productsLoading: boolean;
  upgradesLoading: boolean;
}

export const Plans = ({
  productByPlanKey,
  upgradeByPlanKey,
  currentPlanKey,
  highlightUpgrade,
  PLAN_HIGHLIGHT,
  formatCurrencyAmount,
  subscription,
  switchingPlan,
  handleSwitchPlan,
  handleCheckout,
  productsLoading,
  upgradesLoading,
}: PlansProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {PLAN_ORDER.map((planKey) => {
        const planContent = pricingContent.plans[planKey];
        const stripeProduct = productByPlanKey.get(planKey);
        const upgradeData = upgradeByPlanKey.get(planKey);
        const isCurrent = currentPlanKey === planKey;
        const isHighlighted = highlightUpgrade && planKey === PLAN_HIGHLIGHT && !isCurrent;
        const price = stripeProduct?.prices?.[0];
        const priceAmount = price ? formatCurrencyAmount(price.unit_amount, price.currency) : null;
        const interval = price?.recurring?.interval || 'month';
        const isMostPopular = planContent.badge !== null;

        // Determine CTA state
        const isUpgradeAvailable = upgradeData && !isCurrent;
        const canCheckout = !subscription && stripeProduct && price;
        const isSwitching = switchingPlan === (stripeProduct?.id ?? price?.id);

        return (
          <Card
            key={planKey}
            className={cn(
              "overflow-visible relative flex flex-col transition-all duration-200",
              isCurrent && "border-primary/50 bg-primary/5",
              isHighlighted && "border-primary ring-2 ring-primary/40 shadow-lg shadow-primary/10",
              isMostPopular && !isCurrent && "border-primary/30"
            )}
          >
            {/* Badge row */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-2">
              {isCurrent && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  <Crown className="h-3 w-3" />
                  Current Plan
                </span>
              )}
              {!isCurrent && planContent.badge && (
                <span className="inline-flex items-center rounded-full bg-secondary px-3 py-0.5 text-xs font-semibold text-secondary-foreground">
                  {planContent.badge}
                </span>
              )}
            </div>

            <CardHeader className="pt-8 pb-4">
              <CardTitle className="text-lg">{planContent.name}</CardTitle>
              <CardDescription className="text-xs">{planContent.description}</CardDescription>
              {productsLoading ? (
                <div className="h-8 w-20 animate-pulse rounded bg-foreground/10 mt-2" />
              ) : priceAmount ? (
                <div className="mt-2">
                  <span className="text-3xl font-bold text-foreground">{priceAmount}</span>
                  <span className="text-foreground/50 text-sm">/{interval}</span>
                </div>
              ) : (
                <div className="mt-2 text-sm text-foreground/40">Price unavailable</div>
              )}
            </CardHeader>

            <CardContent className="flex flex-col flex-1 gap-4">
              <ul className="space-y-2 flex-1">
                {planContent.features.map((feature: string) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-2">
                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : currentPlanKey && isUpgradeAvailable ? (
                  <Button
                    className="w-full"
                    variant={isMostPopular ? "default" : "outline"}
                    disabled={isSwitching}
                    onClick={() => handleSwitchPlan(upgradeData.price_id, upgradeData.product_id)}
                  >
                    {isSwitching ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Switching…
                      </>
                    ) : (
                      <>
                        {currentPlanKey && isPlanUpgrade(currentPlanKey, planKey) ? 'Upgrade' : 'Downgrade'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : canCheckout ? (
                  <Button
                    className="w-full"
                    variant={isMostPopular ? "default" : "outline"}
                    disabled={!!switchingPlan}
                    onClick={() => handleCheckout(planKey)}
                  >
                    {isSwitching ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading…
                      </>
                    ) : (
                      <>
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    {upgradesLoading || productsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Not available'
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};