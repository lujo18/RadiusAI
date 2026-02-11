import { TemplateRepository } from '@/lib/supabase/repos/TemplateRepository';
import { requireUserId } from '@/lib/supabase/auth';
import type { Database } from '@/types/database';

const templateService = {
  async getTemplates() {
    const userId = await requireUserId();
    return await TemplateRepository.getTemplates(userId);
  },

  async getTemplate(templateId: string) {
    const userId = await requireUserId();
    return await TemplateRepository.getTemplate(templateId, userId);
  },

  async getTemplatesByBrand(brandId: string) {
    const userId = await requireUserId();
    return await TemplateRepository.getTemplatesByBrand(brandId, userId);
  },

  async createTemplate(templateData: any) {
    const userId = await requireUserId();
    return await TemplateRepository.createTemplate(userId, templateData);
  },

  async updateTemplate(templateId: string, updates: any) {
    const userId = await requireUserId();
    return await TemplateRepository.updateTemplate(templateId, updates, userId);
  },

  async deleteTemplate(templateId: string) {
    const userId = await requireUserId();
    return await TemplateRepository.deleteTemplate(templateId, userId);
  },

  async setDefaultTemplate(templateId: string) {
    const userId = await requireUserId();
    return await TemplateRepository.setDefaultTemplate(templateId, userId);
  },
};

export default templateService;
