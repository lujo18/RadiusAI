/**
 * TanStack Query Hooks for Brand CTA CRUD operations
 * Handles data fetching, caching, and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { brandCtaApi } from '@/features/brand_ctas/surface';
import type { Database } from '@/types/database';

type BrandCtaRow = Database['public']['Tables']['brand_ctas']['Row'];
type BrandCtaInsert = Database['public']['Tables']['brand_ctas']['Insert'];
type BrandCtaUpdate = Database['public']['Tables']['brand_ctas']['Update'];

// Query key factory for consistent caching
export const brandCtaKeys = {
  all: ['brand-ctas'] as const,
  lists: () => [...brandCtaKeys.all, 'list'] as const,
  list: (brandId: string) => [...brandCtaKeys.lists(), brandId] as const,
  details: () => [...brandCtaKeys.all, 'detail'] as const,
  detail: (ctaId: string) => [...brandCtaKeys.details(), ctaId] as const,
};

// ==================== QUERIES ====================

/**
 * Fetch all CTAs for a specific brand
 */
export function useBrandCtas(brandId: string) {
  return useQuery<BrandCtaRow[]>({
    queryKey: brandCtaKeys.list(brandId),
    queryFn: () => brandCtaApi.list(brandId),
    enabled: !!brandId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch a single CTA by ID
 */
export function useBrandCta(ctaId: string | null) {
  return useQuery<BrandCtaRow | null>({
    queryKey: brandCtaKeys.detail(ctaId || ''),
    queryFn: () => brandCtaApi.get(ctaId!),
    enabled: !!ctaId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch all CTAs across all brands
 */
export function useAllBrandCtas() {
  return useQuery<BrandCtaRow[]>({
    queryKey: brandCtaKeys.lists(),
    queryFn: () => brandCtaApi.listAll(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ==================== MUTATIONS ====================

/**
 * Create a new CTA
 */
export function useCreateBrandCta() {
  const queryClient = useQueryClient();

  return useMutation<BrandCtaRow, unknown, { brandId: string; payload: Omit<BrandCtaInsert, 'brand_id'> }>({
    mutationFn: ({ brandId, payload }: { brandId: string; payload: Omit<BrandCtaInsert, 'brand_id'> }) =>
      brandCtaApi.create(brandId, payload),

    onSuccess: (newCta, variables) => {
      // Update the list for this brand
      queryClient.invalidateQueries({ queryKey: brandCtaKeys.list(variables.brandId) });
      // Invalidate all CTAs list
      queryClient.invalidateQueries({ queryKey: brandCtaKeys.lists() });
    },

    onError: (error) => {
      console.error('Failed to create CTA:', error);
    },
  });
}

/**
 * Update an existing CTA
 */
export function useUpdateBrandCta() {
  const queryClient = useQueryClient();

  return useMutation<BrandCtaRow, unknown, { ctaId: string; updates: BrandCtaUpdate }>({
    mutationFn: ({ ctaId, updates }: { ctaId: string; updates: BrandCtaUpdate }) =>
      brandCtaApi.update(ctaId, updates),

    onSuccess: (updatedCta) => {
      // Update the specific CTA cache
      queryClient.setQueryData(brandCtaKeys.detail(updatedCta.id), updatedCta);
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: brandCtaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: brandCtaKeys.list(updatedCta.brand_id) });
    },

    onError: (error) => {
      console.error('Failed to update CTA:', error);
    },
  });
}

/**
 * Delete a CTA
 */
export function useDeleteBrandCta() {
  const queryClient = useQueryClient();

  return useMutation<boolean, unknown, { ctaId: string; brandId: string }>({
    mutationFn: ({ ctaId, brandId }: { ctaId: string; brandId: string }) =>
      brandCtaApi.delete(ctaId),

    onSuccess: (_, variables) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: brandCtaKeys.detail(variables.ctaId) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: brandCtaKeys.list(variables.brandId) });
      queryClient.invalidateQueries({ queryKey: brandCtaKeys.lists() });
    },

    onError: (error) => {
      console.error('Failed to delete CTA:', error);
    },
  });
}

/**
 * Toggle CTA active/inactive status
 */
export function useToggleBrandCtaStatus() {
  const queryClient = useQueryClient();

  return useMutation<BrandCtaRow, unknown, { ctaId: string; isActive: boolean }>({
    mutationFn: ({ ctaId, isActive }: { ctaId: string; isActive: boolean }) =>
      brandCtaApi.toggleStatus(ctaId, isActive),

    onSuccess: (updatedCta) => {
      // Update cache
      queryClient.setQueryData(brandCtaKeys.detail(updatedCta.id), updatedCta);
      queryClient.invalidateQueries({ queryKey: brandCtaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: brandCtaKeys.list(updatedCta.brand_id) });
    },

    onError: (error) => {
      console.error('Failed to toggle CTA status:', error);
    },
  });
}

/**
 * Duplicate a CTA to another brand
 */
export function useDuplicateBrandCta() {
  const queryClient = useQueryClient();

  return useMutation<BrandCtaRow, unknown, { ctaId: string; targetBrandId: string }>({
    mutationFn: ({ ctaId, targetBrandId }: { ctaId: string; targetBrandId: string }) =>
      brandCtaApi.duplicate(ctaId, targetBrandId),

    onSuccess: (newCta) => {
      // Invalidate the target brand's list
      queryClient.invalidateQueries({ queryKey: brandCtaKeys.list(newCta.brand_id) });
      queryClient.invalidateQueries({ queryKey: brandCtaKeys.lists() });
    },

    onError: (error) => {
      console.error('Failed to duplicate CTA:', error);
    },
  });
}

/**
 * Set CTA image after upload
 */
export function useSetCtaImage() {
  const queryClient = useQueryClient();

  return useMutation<BrandCtaRow, unknown, { ctaId: string; imageUrl: string }>({
    mutationFn: ({ ctaId, imageUrl }) =>
      brandCtaApi.setImage(ctaId, imageUrl),

    onSuccess: (updatedCta) => {
      queryClient.setQueryData(brandCtaKeys.detail(updatedCta.id), updatedCta);
      queryClient.invalidateQueries({ queryKey: brandCtaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: brandCtaKeys.list(updatedCta.brand_id) });
    },

    onError: (error) => {
      console.error('Failed to set CTA image:', error);
    },
  });
}

/**
 * Remove CTA image
 */
export function useRemoveCtaImage() {
  const queryClient = useQueryClient();

  return useMutation<BrandCtaRow, unknown, { ctaId: string }>({
    mutationFn: ({ ctaId }) =>
      brandCtaApi.removeImage(ctaId),

    onSuccess: (updatedCta) => {
      queryClient.setQueryData(brandCtaKeys.detail(updatedCta.id), updatedCta);
      queryClient.invalidateQueries({ queryKey: brandCtaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: brandCtaKeys.list(updatedCta.brand_id) });
    },

    onError: (error) => {
      console.error('Failed to remove CTA image:', error);
    },
  });
}
