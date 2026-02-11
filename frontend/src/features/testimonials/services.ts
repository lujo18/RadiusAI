import { TestimonialsRepository } from '@/lib/supabase/repos/TestimonialsRepository';

const testimonialsService = {
  async getTestimonials() {
    return await TestimonialsRepository.getTestimonials();
  },

  async getTestimonial(id: string) {
    return await TestimonialsRepository.getTestimonial(id);
  },

  async createTestimonial(testimonial: any) {
    return await TestimonialsRepository.createTestimonial(testimonial);
  },

  async updateTestimonial(id: string, updates: any) {
    return await TestimonialsRepository.updateTestimonial(id, updates);
  },

  async deleteTestimonial(id: string) {
    return await TestimonialsRepository.deleteTestimonial(id);
  },
};

export { testimonialsService };

export default testimonialsService;
