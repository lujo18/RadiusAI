import testimonialsService from '@/lib/api/services/testimonialsService';

export const testimonialsApi = {
  getTestimonials: async () => {
    return await testimonialsService.getTestimonials();
  },

  getTestimonial: async (id: string) => {
    return await testimonialsService.getTestimonial(id);
  },

  createTestimonial: async (testimonial: any) => {
    return await testimonialsService.createTestimonial(testimonial);
  },

  updateTestimonial: async (id: string, updates: any) => {
    return await testimonialsService.updateTestimonial(id, updates);
  },

  deleteTestimonial: async (id: string) => {
    return await testimonialsService.deleteTestimonial(id);
  },
};

export default testimonialsApi;
