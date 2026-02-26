'use client';

import React from 'react';
import { OnboardingChecklist } from '@/features/onboarding';

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <OnboardingChecklist />
    </>
  );
}
