import { useSubscription } from '@/features/subscription/hooks';
import { useGetCreditsUsage } from '@/features/usage/hooks';
import { toPlanKey, type PlanKey } from '@/lib/plans';

export interface CurrentPlanDisplayData {
  planId: string;
  planKey: PlanKey;
  planName: string;
  planDescription: string;
  benefits: any[];
  features: string[];
  creditsUsed: number;
  creditsLimit: number | null;
  renewalDate: Date | null;
  daysRemaining: number | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Composes plan, subscription, and usage data into a single hook.
 * Features come from Polar product benefits, not hardcoded plan data.
 */
export function useCurrentPlanDisplay(): CurrentPlanDisplayData {
  const { data: subscription, isLoading: subLoading, error: subError } = useSubscription();
  const { data: creditsData, isLoading: creditsLoading } = useGetCreditsUsage();

  const creditsUsed = creditsData?.consumed ?? 0;
  const creditsLimit = creditsData?.limit ?? null;

  // Extract product info and benefits from subscription
  // subscription can be from different providers (Stripe legacy shape or Polar shape).
  // Use a permissive cast when accessing provider-specific fields.
  const product = subscription?.product;
  const planId = product?.id || 'unknown_plan';
  const planName = product?.name || 'Plan';
  const planDescription = product?.description || '';
  const planKey = toPlanKey(planName);
  const benefits = product?.benefits || [];
  const features = benefits
    .map((benefit: { description?: string | null; type?: string | null }) => {
      const description = benefit.description?.trim();
      if (description) return description;
      const fallbackType = benefit.type?.replace(/_/g, ' ').trim();
      return fallbackType || '';
    })
    .filter((feature: string) => feature.length > 0);
  
  // Calculate days remaining from subscription period end
  let renewalDate: Date | null = null;
  let daysRemaining: number | null = null;

  if (subscription?.current_period_end) {
    renewalDate = new Date(subscription.current_period_end);
    const now = new Date();
    daysRemaining = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  const isLoading = subLoading || creditsLoading;
  const error = subError?.message || null;

  return {
    planId,
    planKey: product?.name as PlanKey,
    planName,
    planDescription,
    benefits,
    features,
    creditsUsed,
    creditsLimit,
    renewalDate,
    daysRemaining,
    isLoading,
    error,
  };
}
