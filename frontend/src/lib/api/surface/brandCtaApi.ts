/**
 * Brand CTA Surface API
 * Stable, UI-facing API that wraps the service layer
 */

import { brandCtaService } from '@/lib/api/services/brandCtaService';
import type { Database } from '@/types/database';

type BrandCtaInsert = Database['public']['Tables']['brand_ctas']['Insert'];
type BrandCtaUpdate = Database['public']['Tables']['brand_ctas']['Update'];

/**
 * Public API for brand CTA operations
 * All methods return promises for easy integration with React Query
 */
export const brandCtaApi = {
  // GET operations
  list: (brandId: string) => brandCtaService.getBrandCtas(brandId),
  get: (ctaId: string) => brandCtaService.getBrandCta(ctaId),
  listAll: () => brandCtaService.getAllCtas(),

  // POST operations
  create: (brandId: string, payload: Omit<BrandCtaInsert, 'brand_id'>) =>
    brandCtaService.createBrandCta(brandId, payload),

  // PUT/PATCH operations
  update: (ctaId: string, updates: BrandCtaUpdate) =>
    brandCtaService.updateBrandCta(ctaId, updates),

  // DELETE operations
  delete: (ctaId: string) => brandCtaService.deleteBrandCta(ctaId),

  // Additional operations
  toggleStatus: (ctaId: string, isActive: boolean) =>
    brandCtaService.toggleCtaStatus(ctaId, isActive),

  duplicate: (ctaId: string, targetBrandId: string) =>
    brandCtaService.duplicateCta(ctaId, targetBrandId),
};
