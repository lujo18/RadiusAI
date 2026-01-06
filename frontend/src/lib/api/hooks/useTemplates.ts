// React Query hooks for Templates

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templateApi } from '@/lib/api/client';

// Query Keys
export const templateKeys = {
  all: ['templates'] as const,
  byBrand: (brandId: string | null) => ['templates', 'brand', brandId] as const,
  detail: (id: string) => ['templates', id] as const,
};

// ==================== QUERIES ====================

export function useTemplates(brandId?: string | null) {
  return useQuery({
    queryKey: brandId !== undefined ? templateKeys.byBrand(brandId) : templateKeys.all,
    queryFn: async () => {
      if (brandId) {
        return await templateApi.getTemplatesByBrand(brandId); 
      }
      return await templateApi.getTemplates();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useTemplate(templateId: string) {
  return useQuery({
    queryKey: templateKeys.detail(templateId),
    queryFn: () => templateApi.getTemplate(templateId),
    enabled: !!templateId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// ==================== MUTATIONS ====================

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  console.log("Tanstack Create Template", queryClient)

  return useMutation({
    mutationFn: templateApi.createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId, updates }: { templateId: string; updates: any }) => 
      templateApi.updateTemplate({ templateId, updates }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
      queryClient.invalidateQueries({ queryKey: templateKeys.detail(variables.templateId) });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: templateApi.deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
    },
  });
}

export function useSetDefaultTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: templateApi.setDefaultTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
    },
  });
}
