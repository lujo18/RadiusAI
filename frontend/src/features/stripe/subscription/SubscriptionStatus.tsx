import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { getStatusBadgeColor, formatDate, formatCurrency } from "@/features/stripe/utils/formatting";

interface SubscriptionStatusProps {
  planName: string;
  planDescription: string;
  monthlyPrice: string;
  currency: string;
  status: string;
  nextBillingDate: string;
  portalLoading: boolean;
  onOpenPortal: () => Promise<void>;
}

export const SubscriptionStatus = ({
  planName,
  planDescription,
  monthlyPrice,
  currency,
  status,
  nextBillingDate,
  portalLoading,
  onOpenPortal,
}: SubscriptionStatusProps) => {
  return (
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
        <div className="pt-4 border-t border-border">
          <Button
            onClick={onOpenPortal}
            disabled={portalLoading}
            className="w-full"
            variant="default"
          >
            {portalLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Opening Subscription Manager…
              </>
            ) : (
              'Manage Subscription in Stripe'
            )}
          </Button>
          <p className="text-xs text-foreground/50 mt-3 text-center">
            Update payment methods, adjust billing frequency, or cancel your subscription
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
