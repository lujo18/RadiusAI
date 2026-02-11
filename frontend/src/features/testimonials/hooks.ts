import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { testimonialsApi } from '@/lib/api/client';
import type { Database } from '@/types/database';

type Testimonial = Database['public']['Tables']['testimonials']['Row'];
type TestimonialInsert = Database['public']['Tables']['testimonials']['Insert'];
type TestimonialUpdate = Database['public']['Tables']['testimonials']['Update'];

export const useTestimonials = () => {
  return useQuery({
    queryKey: ['testimonials'],
    queryFn: () => testimonialsApi.getTestimonials(),
  });
};

export const useTestimonial = (id: string) => {
  return useQuery({
    queryKey: ['testimonial', id],
    queryFn: () => testimonialsApi.getTestimonial(id),
    enabled: !!id,
  });
};

export const useCreateTestimonial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (testimonial: TestimonialInsert) =>
      testimonialsApi.createTestimonial(testimonial),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
    },
  });
};

export const useUpdateTestimonial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: TestimonialUpdate }) =>
      testimonialsApi.updateTestimonial(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
    },
  });
};

export const useDeleteTestimonial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => testimonialsApi.deleteTestimonial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
    },
  });
};
