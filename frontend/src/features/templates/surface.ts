import { templateService } from '@/features/templates/services';

export const templateApi = {
  getTemplates: async () => {
    return await templateService.getTemplates();
  },

  getTemplate: async (templateId: string) => {
    return await templateService.getTemplate(templateId);
  },

  getTemplatesByBrand: async (brandId: string) => {
    return await templateService.getTemplatesByBrand(brandId);
  },

  createTemplate: async (templateData: any) => {
    return await templateService.createTemplate(templateData);
  },

  updateTemplate: async (templateId: string, updates: any) => {
    return await templateService.updateTemplate(templateId, updates);
  },

  deleteTemplate: async (templateId: string) => {
    return await templateService.deleteTemplate(templateId);
  },

  setDefaultTemplate: async (templateId: string, brandId: string) => {
    return await templateService.setDefaultTemplate(templateId, brandId);
  },
};

export default templateApi;
