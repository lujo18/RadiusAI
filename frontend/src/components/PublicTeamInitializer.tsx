'use client';

import { useEffect } from 'react';
import { usePublicTeam } from '@/hooks/usePublicTeam';
import { setPublicTeamId } from '@/lib/api/clients/backendClient';

export const PublicTeamInitializer = () => {
  const { teamId } = usePublicTeam();

  useEffect(() => {
    setPublicTeamId(teamId);
  }, [teamId]);

  return null; // This component doesn't render anything
};
