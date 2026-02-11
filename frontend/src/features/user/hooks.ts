// React Query hooks for User Profile

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/lib/api/client';
import type { Database } from '@/types/database';

// Query Keys
export const userKeys = {
  profile: ['user', 'profile'] as const,
  accounts: ['user', 'accounts'] as const,
};

// ==================== QUERIES ====================

export function useUserProfile() {
  return useQuery<Database['public']['Tables']['users']['Row'] | null>({
    queryKey: userKeys.profile,
    queryFn: userApi.getProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Alias for backward compatibility
export const useUser = useUserProfile;

export function useConnectedAccounts() {
  return useQuery<any[]>({
    queryKey: userKeys.accounts,
    queryFn: userApi.getConnectedAccounts,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ==================== MUTATIONS ====================

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(userKeys.profile, data);
    },
  });
}

export function isAdminUser() {
  const { data: profile } = useUserProfile();
  return profile?.is_admin || false;
}
