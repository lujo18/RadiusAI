"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TeamRepository } from '@/lib/supabase/repos/TeamRepository';
import { BrandRepository } from '@/lib/supabase/repos/BrandRepository';

export default function OverviewRedirectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Prevent double-execution from React StrictMode or fast remounts
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const redirectToTeam = async () => {
      try {
        // Get user's first (primary) team
        let firstTeamId = await TeamRepository.getFirstTeam();

        if (!firstTeamId) {
          // New user — auto-create a default workspace so they can explore
          firstTeamId = await TeamRepository.createDefaultTeam();
        }

        // Ensure the user has at least one brand; create a placeholder if not
        let firstBrandId = await BrandRepository.getFirstBrand(firstTeamId);
        if (!firstBrandId) {
          firstBrandId = await BrandRepository.createDefaultBrand(firstTeamId);
        }

        // Route directly into the brand so they see real nav / content
        router.replace(`/${firstTeamId}/brand/${firstBrandId}/overview`);
      } catch (err) {
        console.error('Redirect error:', err);
        setError('An error occurred while setting up your workspace. Please try refreshing.');
        setLoading(false);
      }
    };

    redirectToTeam();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen flex-col gap-4">
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
          <p className="text-muted-foreground">Setting up your workspace…</p>
        </>
      ) : (
        <>
          <p className="text-destructive font-semibold">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="btn-primary"
          >
            Back to Login
          </button>
        </>
      )}
    </div>
  );
}
