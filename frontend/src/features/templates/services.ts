import { TemplateRepository } from "@/lib/supabase/repos/TemplateRepository";
import { BrandRepository } from "@/lib/supabase/repos/BrandRepository";
import { requireUserId } from "@/lib/supabase/auth";
import type { Database } from "@/types/database";

const templateService = {
  async getTemplates() {
    // Try to get accessible brands, but fall back to querying with RLS if it fails
    const brandIds = await BrandRepository.getAccessibleBrandIds();
    console.log('[SERVICE] getTemplates - brandIds:', brandIds);
    
    if (brandIds.length > 0) {
      return await TemplateRepository.getTemplates(brandIds);
    } else {
      // Fallback: query all and let RLS filter
      console.log('[SERVICE] No branded IDs, falling back to RLS-only filtering');
      return await TemplateRepository.getTemplatesWithoutBrandFilter();
    }
  },

  async getTemplate(templateId: string) {
    return await TemplateRepository.getTemplate(templateId);
  },

  async getTemplatesByBrand(brandId: string) {
    if (!brandId) throw new Error('brandId is required');
    return await TemplateRepository.getTemplatesByBrand(brandId);
  },

  async getBrandTemplateWithAnalytics(brandId: string) {
    if (!brandId) throw new Error('brandId is required');
    return await TemplateRepository.getBrandTemplatesWithAnalytics(brandId);
  },

  async createTemplate(templateData: any) {
    if (!templateData.brand_id) throw new Error('brand_id is required in template data');
    return await TemplateRepository.createTemplate(templateData);
  },

  async updateTemplate(templateId: string, updates: any) {
    return await TemplateRepository.updateTemplate(templateId, updates);
  },

  async deleteTemplate(templateId: string) {
    return await TemplateRepository.deleteTemplate(templateId);
  },

  async setDefaultTemplate(templateId: string, brandId: string) {
    if (!brandId) throw new Error('brandId is required');
    return await TemplateRepository.setDefaultTemplate(templateId, brandId);
  },
};

export { templateService };

export default templateService;
