// React Query hooks for Brands

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser, requireUserId } from '@/lib/supabase/auth';
import { BrandRepository } from '@/lib/supabase/repos/BrandRepository';
import type { Database } from '@/types/database';

// Query Keys
export const brandKeys = {
  all: ['brands'] as const,
  detail: (brandId: string) => ['brands', brandId] as const,
};

// ==================== QUERIES ====================

export function useBrands() {
  return useQuery({
    queryKey: brandKeys.all,
    queryFn: async () => {
      const userId = await requireUserId();
      return BrandRepository.getBrands(userId);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

 
// ==================== MUTATIONS ====================

export function useCreateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (brandData: any) => {
      // No userId needed for creation, brandData should include user_id
      return BrandRepository.createBrand(brandData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.all });
    },
  });
}

export function useUpdateBrandSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ brandId, brandSettings }: { brandId: string; brandSettings: any }) => {
      const userId = await requireUserId();
      return BrandRepository.updateBrandSettings(brandId, userId, brandSettings);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: brandKeys.all });
      queryClient.invalidateQueries({ queryKey: brandKeys.detail(variables.brandId) });
    },
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (brandId: string) => {
      const userId = await requireUserId();
      return BrandRepository.deleteBrand(brandId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.all });
    },
  });
}

export function useAddIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ brandId, integration }: { brandId: string; integration: any }) => {
      const userId = await requireUserId();
      return BrandRepository.createBrandIntegration(brandId, userId, integration);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: brandKeys.all });
      queryClient.invalidateQueries({ queryKey: brandKeys.detail(variables.brandId) });
    },
  });
}

export function useRemoveIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ integrationId }: { integrationId: string }) => {
      const userId = await requireUserId();
      return BrandRepository.deleteBrandIntegration(integrationId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.all });
    },
  });
}
