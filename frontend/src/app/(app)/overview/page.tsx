"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TeamRepository } from '@/lib/supabase/repos/TeamRepository';

export default function OverviewRedirectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const redirectToTeam = async () => {
      try {
        // Get user's first (primary) team
        const firstTeamId = await TeamRepository.getFirstTeam();
        
        if (!firstTeamId) {
          // User has no teams - redirect to create one or login page
          router.replace('/login?error=no_teams');
          return;
        }

        router.replace(`/${firstTeamId}/overview`);
      } catch (err) {
        console.error('Redirect error:', err);
        setError('An error occurred while loading your teams');
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
          <p className="text-muted-foreground">Redirecting to your dashboard...</p>
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
