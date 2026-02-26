import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useBrand } from '@/features/brand/hooks';
import { useTemplates } from '@/features/templates/hooks';
import { useBrandCtas } from '@/features/brand_ctas/hooks';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';
import type { OnboardingStep } from './types';

function useDismissed(brandId: string) {
  const storageKey = `onboarding_dismissed_${brandId}`;

  const isDismissed = (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(storageKey) === 'true';
  };

  const dismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'true');
    }
  };

  const restore = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
  };

  return { isDismissed, dismiss, restore };
}

export interface OnboardingChecklistState {
  steps: OnboardingStep[];
  completedCount: number;
  totalCount: number;
  allComplete: boolean;
  isLoading: boolean;
  dismiss: () => void;
  isDismissed: () => boolean;
}

export function useOnboardingChecklist(): OnboardingChecklistState {
  const params = useParams();
  const teamId = params?.teamId as string;
  const brandId = params?.brandId as string;

  const { data: brand, isLoading: brandLoading } = useBrand(brandId);
  const { data: templates, isLoading: templatesLoading } = useTemplates(brandId);
  const { data: ctas, isLoading: ctasLoading } = useBrandCtas(brandId);
  const { isActive: isSubscribed, isLoading: subLoading } = useSubscriptionGuard();

  const { dismiss, isDismissed } = useDismissed(brandId);

  const isLoading = brandLoading || templatesLoading || ctasLoading || subLoading;

  const steps = useMemo<OnboardingStep[]>(() => {
    const base = `/${teamId}/brand/${brandId}`;
    const settings = (brand?.brand_settings ?? {}) as Record<string, any>;

    // Step 1: Brand profile — niche filled in signals real setup
    const brandFilled = !!settings?.niche && settings.niche.trim() !== '';

    // Step 2: At least one template attached to this brand
    const hasTemplates = Array.isArray(templates) && templates.length > 0;

    // Step 3: At least one active CTA
    const hasCta = Array.isArray(ctas) && ctas.some((c: any) => c.is_active !== false);

    // Step 4: Has an active subscription
    const hasSubscription = isSubscribed;

    return [
      {
        key: 'brand_profile',
        title: 'Complete your brand profile',
        description:
          "Tell the AI about your niche, voice, and audience — this is what makes every post sound like you.",
        href: `${base}/settings`,
        ctaLabel: 'Set up brand',
        completed: brandFilled,
      },
      {
        key: 'templates',
        title: 'Pick your starter templates',
        description:
          'Templates define the slide structure of your carousels. Add a few system templates to your brand to get started.',
        href: `${base}/templates`,
        ctaLabel: 'Browse templates',
        completed: hasTemplates,
      },
      {
        key: 'cta',
        title: 'Add a call-to-action',
        description:
          'CTAs get appended to the end of your posts. Add at least one so your audience knows what to do next.',
        href: `${base}/settings/ctas`,
        ctaLabel: 'Add CTA',
        completed: hasCta,
        optional: true,
      },
      {
        key: 'subscribed',
        title: 'Subscribe to start generating',
        description:
          "Once you've set up your brand, subscribe to unlock AI generation, automation, and scheduled posting.",
        href: `/${teamId}/settings/billing?upgrade=true`,
        ctaLabel: 'View plans',
        completed: hasSubscription,
      },
    ];
  }, [brand, templates, ctas, isSubscribed, teamId, brandId]);

  const completedCount = steps.filter((s) => s.completed).length;
  const allComplete = completedCount === steps.length;

  return {
    steps,
    completedCount,
    totalCount: steps.length,
    allComplete,
    isLoading,
    dismiss,
    isDismissed,
  };
}
