/**
 * Brand CTA Service Layer
 * Handles business logic, validation, and error handling
 */

import { brandCtasRepo } from './repo';
import { BrandCtaSchema } from '@/lib/validation/brandSchemas';
import type { Database } from '@/types/database';

type BrandCtaRow = Database['public']['Tables']['brand_ctas']['Row'];
type BrandCtaInsert = Database['public']['Tables']['brand_ctas']['Insert'];
type BrandCtaUpdate = Database['public']['Tables']['brand_ctas']['Update'];

export const brandCtaService = {
  /**
   * Get all CTAs for a brand
   */
  async getBrandCtas(brandId: string): Promise<BrandCtaRow[]> {
    try {
      return await brandCtasRepo.list(brandId);
    } catch (error) {
      console.error('Error fetching brand CTAs:', error);
      throw error;
    }
  },

  /**
   * Get a single CTA by ID
   */
  async getBrandCta(ctaId: string): Promise<BrandCtaRow | null> {
    try {
      return await brandCtasRepo.getById(ctaId);
    } catch (error) {
      console.error('Error fetching CTA:', error);
      throw error;
    }
  },

  /**
   * Create a new CTA with validation
   */
  async createBrandCta(
    brandId: string,
    payload: Omit<BrandCtaInsert, 'brand_id'>
  ): Promise<BrandCtaRow> {
    try {
      const fullPayload: BrandCtaInsert = {
        ...payload,
        brand_id: brandId,
      } as BrandCtaInsert;

      return await brandCtasRepo.create(fullPayload);
    } catch (error) {
      console.error('Error creating CTA:', error);
      throw error;
    }
  },

  /**
   * Update an existing CTA
   */
  async updateBrandCta(ctaId: string, updates: BrandCtaUpdate): Promise<BrandCtaRow> {
    try {
      return await brandCtasRepo.update(ctaId, updates);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      console.error('Error updating CTA:', errorMsg, error);
      throw error;
    }
  },

  /**
   * Delete a CTA
   */
  async deleteBrandCta(ctaId: string): Promise<boolean> {
    try {
      return await brandCtasRepo.remove(ctaId);
    } catch (error) {
      console.error('Error deleting CTA:', error);
      throw error;
    }
  },

  /**
   * Get all CTAs across all brands
   */
  async getAllCtas(): Promise<BrandCtaRow[]> {
    try {
      return await brandCtasRepo.list();
    } catch (error) {
      console.error('Error fetching all CTAs:', error);
      throw error;
    }
  },

  /**
   * Toggle CTA active status
   */
  async toggleCtaStatus(ctaId: string, isActive: boolean): Promise<BrandCtaRow> {
    try {
      return await brandCtasRepo.update(ctaId, { is_active: isActive });
    } catch (error) {
      console.error('Error toggling CTA status:', error);
      throw error;
    }
  },

  /**
   * Duplicate a CTA to the same or different brand
   */
  async duplicateCta(ctaId: string, targetBrandId: string): Promise<BrandCtaRow> {
    try {
      const original = await brandCtasRepo.getById(ctaId);
      if (!original) throw new Error('CTA not found');

      const { id, created_at, updated_at, ...ctaData } = original;

      const newCta = await brandCtasRepo.create({
        ...ctaData,
        brand_id: targetBrandId,
      });

      return newCta;
    } catch (error) {
      console.error('Error duplicating CTA:', error);
      throw error;
    }
  },
};

export default brandCtaService;
