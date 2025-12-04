// React Query hooks for Templates

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templateApi } from '@/lib/api/client';

// Query Keys
export const templateKeys = {
  all: ['templates'] as const,
  detail: (id: string) => ['templates', id] as const,
};

// ==================== QUERIES ====================

export function useTemplates() {
  return useQuery({
    queryKey: templateKeys.all,
    queryFn: templateApi.getTemplates,
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
