/**
 * Brand Filter Hook
 * 
 * This hook provides the active brand filter from URL params.
 * When no brandId in URL, it means viewing overview - queries should fetch all data for the user.
 * When brandId is in URL, queries should filter by both user_id AND brand_id.
 */

import { useParams } from 'next/navigation';

export interface BrandFilter {
  /** null = "Overview" (all brands), string = specific brand ID from URL */
  activeBrandId: string | null;
  /** True if viewing all brands combined (overview) */
  isOverview: boolean;
  /** True if viewing a specific brand */
  isBrandSpecific: boolean;
}

/**
 * Get the current brand filter state from URL params
 */
export function useBrandFilter(): BrandFilter {
  const params = useParams();
  const activeBrandId = (params?.brandId as string) || null;

  return {
    activeBrandId,
    isOverview: activeBrandId === null,
    isBrandSpecific: activeBrandId !== null,
  };
}

/**
 * Get query filter parameters for Supabase queries
 * Use this to build your query conditions
 */
export function useBrandQueryFilter() {
  const { activeBrandId, isOverview } = useBrandFilter();

  return {
    brandId: activeBrandId,
    includeAllBrands: isOverview,
  };
}
