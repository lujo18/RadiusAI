// React Query hooks for Profiles

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProfileRepository } from '@/lib/supabase/repos/ProfileRepository';
import { requireUserId } from '@/lib/supabase/auth';
import { brandService } from '../brand';
import { useParams } from 'next/navigation';
import { BrandRepository } from '@/lib/supabase/repos/BrandRepository';

// Query Keys
export const profileKeys = {
  all: ['profiles'] as const,
  detail: (profileId: string) => ['profiles', profileId] as const,
};

// ==================== QUERIES ====================

export function useProfiles() {
  return useQuery({
    queryKey: profileKeys.all,
    queryFn: async () => {
      const userId = await requireUserId();
      return ProfileRepository.getProfiles(userId);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

 
// ==================== MUTATIONS ====================
// (You should update the mutation functions below to use ProfileRepository as well)

export function useCreateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileData: any) => {
      // No userId needed for creation, profileData should include user_id
      return ProfileRepository.createProfile(profileData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

export function useUpdateBrandSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profileId, brandSettings }: { profileId: string; brandSettings: any }) => {
      const userId = await requireUserId();
      return ProfileRepository.updateBrandSettings(profileId, userId, brandSettings);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(variables.profileId) });
    },
  });
}

export function useDeleteProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileId: string) => {
      const userId = await requireUserId();
      return ProfileRepository.deleteProfile(profileId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}
