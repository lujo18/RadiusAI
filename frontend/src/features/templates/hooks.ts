// React Query hooks for Templates

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templateService } from './services';
import type { Database } from '@/types/database';

// Query Keys
export const templateKeys = {
  all: ['templates'] as const,
  byBrand: (brandId: string | null) => ['templates', 'brand', brandId] as const,
  detail: (id: string) => ['templates', id] as const,
};

// ==================== QUERIES ====================

export function useTemplates(brandId?: string | null) {
  return useQuery<any[]>({
    queryKey: brandId !== undefined ? templateKeys.byBrand(brandId) : templateKeys.all,
    queryFn: async () => {
      if (brandId) {
        return await templateService.getTemplatesByBrand(brandId);
      }
      return await templateService.getTemplates();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useTemplate(templateId: string) {
  return useQuery<any | null>({
    queryKey: templateKeys.detail(templateId),
    queryFn: () => templateService.getTemplate(templateId),
    enabled: !!templateId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useTemplatesWithAnalytics(brandId: string) {
  return useQuery<any[]>({
    queryKey: ['brand-template-analytics', brandId] as const,
    queryFn: () => templateService.getBrandTemplateWithAnalytics(brandId),
    enabled: !!brandId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ==================== MUTATIONS ====================

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  console.log("Tanstack Create Template", queryClient)

  return useMutation({
    mutationFn: templateService.createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId, updates }: { templateId: string; updates: any }) => 
      templateService.updateTemplate(templateId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
      queryClient.invalidateQueries({ queryKey: templateKeys.detail(variables.templateId) });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: templateService.deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
    },
  });
}

export function useSetDefaultTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: templateService.setDefaultTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
    },
  });
}
