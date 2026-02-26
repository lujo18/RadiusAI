// React Query hooks for Templates

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { templateService } from './services';
import { useGetTemplateUsage, useTrackTemplate } from '@/features/usage/hooks';
import type { Database } from '@/types/database';

// Query Keys - simplified to use brandId where available
export const templateKeys = {
  all: () => ['templates'] as const,
  byBrand: (brandId: string) => ['templates', 'brand', brandId] as const,
  detail: (id: string) => ['templates', id] as const,
  withAnalytics: (brandId: string) => ['templates', 'analytics', brandId] as const,
};

// ==================== QUERIES ====================

export function useTemplates(brandId?: string | null) {
  return useQuery<any[]>({
    queryKey: brandId ? templateKeys.byBrand(brandId) : templateKeys.all(),
    queryFn: async () => {
      if (brandId) {
        return await templateService.getTemplatesByBrand(brandId);
      }
      return await templateService.getTemplates();
    },
    enabled: brandId ? !!brandId : true,
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
    queryKey: templateKeys.withAnalytics(brandId),
    queryFn: async () => {
      console.log('[HOOK] useTemplatesWithAnalytics - fetching for brandId:', brandId);
      try {
        const result = await templateService.getBrandTemplateWithAnalytics(brandId);
        console.log('[HOOK] useTemplatesWithAnalytics - result:', { count: result?.length, data: result });
        return result;
      } catch (error) {
        console.error('[HOOK] useTemplatesWithAnalytics - error:', error);
        throw error;
      }
    },
    enabled: !!brandId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ==================== MUTATIONS ====================

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  const { data: templateUsage } = useGetTemplateUsage();

  return useMutation({
    mutationFn: async (templateData: any) => {
      // Check and track template usage first
      
      if (templateUsage?.remaining !== null && templateUsage?.remaining! <= 0) {
        throw new Error('Template limit exceeded');
      }

      // If allowed, proceed with template creation
      return templateService.createTemplate(templateData);
    },
    onSuccess: (data) => {
      // Invalidate all template queries (matches all keys starting with 'templates')
      queryClient.invalidateQueries({ queryKey: templateKeys.all() });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId, updates }: { templateId: string; updates: any }) => 
      templateService.updateTemplate(templateId, updates),
    onSuccess: (data, variables) => {
      // Invalidate all template queries (matches all keys starting with 'templates')
      queryClient.invalidateQueries({ queryKey: templateKeys.all() });
      queryClient.invalidateQueries({ queryKey: templateKeys.detail(variables.templateId) });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => templateService.deleteTemplate(templateId),
    onSuccess: () => {
      // Invalidate all template queries (matches all keys starting with 'templates')
      queryClient.invalidateQueries({ queryKey: templateKeys.all() });
    },
  });
}

export function useSetDefaultTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId, brandId }: { templateId: string; brandId: string }) => 
      templateService.setDefaultTemplate(templateId, brandId),
    onSuccess: () => {
      // Invalidate all template queries (matches all keys starting with 'templates')
      queryClient.invalidateQueries({ queryKey: templateKeys.all() });
    },
  });
}
