'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface PublicTeamContextType {
  teamId: string | null;
  isPublic: boolean;
}

const PublicTeamContext = createContext<PublicTeamContextType>({
  teamId: null,
  isPublic: false,
});

export const PublicTeamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const searchParams = useSearchParams();
  const [state, setState] = useState<PublicTeamContextType>({
    teamId: null,
    isPublic: false,
  });

  useEffect(() => {
    const teamId = searchParams.get('team_id');
    if (teamId) {
      setState({
        teamId,
        isPublic: true,
      });
    } else {
      setState({
        teamId: null,
        isPublic: false,
      });
    }
  }, [searchParams]);

  return (
    <PublicTeamContext.Provider value={state}>
      {children}
    </PublicTeamContext.Provider>
  );
};

export const usePublicTeam = () => {
  const context = useContext(PublicTeamContext);
  if (!context) {
    throw new Error('usePublicTeam must be used within PublicTeamProvider');
  }
  return context;
};
