// React Query hooks for Brands

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { getCurrentUser, requireUserId } from '@/lib/supabase/auth';
import { BrandRepository } from '@/lib/supabase/repos/BrandRepository';
import { brandApi } from '@/lib/api/client';
import { useTrackBrand } from '@/features/usage/hooks';
import type { Database } from '@/types/database';

// Query Keys
export const brandKeys = {
  all: () => ['brands'] as const,
  allForTeam: (teamId: string) => ['brands', teamId] as const,
  detail: (brandId: string) => ['brands', brandId] as const,
  detailWithTeam: (teamId: string, brandId: string) => ['brands', teamId, brandId] as const,
};

// ==================== QUERIES ====================

export function useBrands() {
  const params = useParams()
  const teamId = params.teamId as string

  return useQuery({
    queryKey: brandKeys.allForTeam(teamId),
    queryFn: async () => {
      return BrandRepository.getBrands(teamId);
    },
    enabled: !!teamId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useBrand(brandId: string) {
  const params = useParams()
  const teamId = params.teamId as string

  return useQuery({
    queryKey: brandKeys.detailWithTeam(teamId, brandId),
    queryFn: async () => {
      return BrandRepository.getBrand(brandId, teamId);
    },
    enabled: !!brandId && !!teamId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ==================== INTEGRATIONS ====================

export function useBrandIntegrations(brandId: string) {
  const params = useParams()
  const teamId = params.teamId as string

  return useQuery({
    queryKey: ["brand-integrations", teamId, brandId],
    queryFn: async () => {
      return await BrandRepository.getBrandIntegrations(brandId);
    },
    enabled: !!brandId && !!teamId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
 
// ==================== MUTATIONS ====================

export function useCreateBrand() {
  const queryClient = useQueryClient();
  const params = useParams()
  const teamId = params.teamId as string
  const trackBrandMutation = useTrackBrand();

  return useMutation({
    mutationFn: async (brandData: any) => {
      // Check and track brand usage first
      const trackResult = await trackBrandMutation.mutateAsync();
      
      if (!trackResult.allowed) {
        throw new Error(trackResult.message || 'Brand limit exceeded');
      }

      // If allowed, proceed with brand creation
      return BrandRepository.createBrand({ ...brandData, team_id: teamId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.allForTeam(teamId) });
    },
  });
}

export function useUpdateBrandSettings() {
  const queryClient = useQueryClient();
  const params = useParams()
  const teamId = params.teamId as string

  return useMutation({
    mutationFn: async ({ brandId, brandSettings }: { brandId: string; brandSettings: any }) => {
      return BrandRepository.updateBrandSettings(brandId, teamId, brandSettings);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: brandKeys.allForTeam(teamId) });
      queryClient.invalidateQueries({ queryKey: brandKeys.detailWithTeam(teamId, variables.brandId) });
    },
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();
  const params = useParams()
  const teamId = params.teamId as string

  return useMutation({
    mutationFn: async (brandId: string) => {
      return BrandRepository.deleteBrand(brandId, teamId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.allForTeam(teamId) });
    },
  });
}

export function useAddIntegration() {
  const queryClient = useQueryClient();
  const params = useParams()
  const teamId = params.teamId as string

  return useMutation({
    mutationFn: async ({ brandId, integration }: { brandId: string; integration: any }) => {
      return BrandRepository.createBrandIntegration(brandId, teamId, integration);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: brandKeys.allForTeam(teamId) });
      queryClient.invalidateQueries({ queryKey: brandKeys.detailWithTeam(teamId, variables.brandId) });
      queryClient.invalidateQueries({ queryKey: ['brand-integrations', teamId, variables.brandId] });
    },
  });
}

export function useRemoveIntegration() {
  const queryClient = useQueryClient();
  const params = useParams()
  const teamId = params.teamId as string

  return useMutation({
    mutationFn: async ({ integrationId }: { integrationId: string; brandId?: string }) => {
      if (brandApi?.disconnectSocialAccount) {
        return brandApi.disconnectSocialAccount({ integration_id: integrationId });
      }
      return BrandRepository.deleteBrandIntegration(integrationId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: brandKeys.allForTeam(teamId) });
      const brandId = (variables as any)?.brandId as string | undefined;
      if (brandId) {
        queryClient.invalidateQueries({ queryKey: ['brand-integrations', teamId, brandId] });
      }
    },
  });
}
