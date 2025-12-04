// React Query hooks for Profiles

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserProfiles,
  getProfile,
  createProfile,
  updateBrandSettings,
  deleteProfile,
  addIntegration,
  removeIntegration,
} from '@/lib/firebase/firestore/profiles';
import type { BrandSettings, PlatformIntegration } from '@/types/user';

// Query Keys
export const profileKeys = {
  all: ['profiles'] as const,
  detail: (profileId: string) => ['profiles', profileId] as const,
};

// ==================== QUERIES ====================

export function useProfiles() {
  return useQuery({
    queryKey: profileKeys.all,
    queryFn: getUserProfiles,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useProfile(profileId: string) {
  return useQuery({
    queryKey: profileKeys.detail(profileId),
    queryFn: () => getProfile(profileId),
    enabled: !!profileId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ==================== MUTATIONS ====================

export function useCreateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

export function useUpdateBrandSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ profileId, brandSettings }: { 
      profileId: string; 
      brandSettings: BrandSettings 
    }) => updateBrandSettings(profileId, brandSettings),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(variables.profileId) });
    },
  });
}

export function useDeleteProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

export function useAddIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ profileId, integration }: {
      profileId: string;
      integration: PlatformIntegration;
    }) => addIntegration(profileId, integration),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(variables.profileId) });
    },
  });
}

export function useRemoveIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ profileId, integrationId }: {
      profileId: string;
      integrationId: string;
    }) => removeIntegration(profileId, integrationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(variables.profileId) });
    },
  });
}
