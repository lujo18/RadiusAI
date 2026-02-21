"use client";

import React from 'react';
import { redirect } from 'next/navigation';

export default function BrandIdPage({ params }: { params: Promise<{ brandId: string; teamId: string }> }) {
  const resolvedParams = React.use(params);
  // Validate brandId is not undefined or invalid before redirecting
  if (!resolvedParams.brandId || resolvedParams.brandId === 'undefined' || resolvedParams.brandId.trim() === '') {
    redirect(`/${resolvedParams.teamId}/overview`);
  }
  // Redirect to brand overview page
  redirect(`/${resolvedParams.teamId}/brand/${resolvedParams.brandId}/overview`);
}
