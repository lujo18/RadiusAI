export type OnboardingStepKey =
  | 'brand_profile'
  | 'templates'
  | 'cta'
  | 'subscribed';

export interface OnboardingStep {
  key: OnboardingStepKey;
  title: string;
  description: string;
  /** Absolute href the CTA button navigates to */
  href: string;
  ctaLabel: string;
  completed: boolean;
  /** Don't block on this step — it's optional but encouraged */
  optional?: boolean;
}
