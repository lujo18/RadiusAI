// React Query hooks for User Profile

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/lib/api/client';

// Query Keys
export const userKeys = {
  profile: ['user', 'profile'] as const,
  accounts: ['user', 'accounts'] as const,
};

// ==================== QUERIES ====================

export function useUserProfile() {
  return useQuery({
    queryKey: userKeys.profile,
    queryFn: userApi.getProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Alias for backward compatibility
export const useUser = useUserProfile;

export function useConnectedAccounts() {
  return useQuery({
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
