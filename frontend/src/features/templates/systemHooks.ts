import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemTemplatesApi } from '@/lib/api/client';
import type { Database } from '@/types/database';

type SystemTemplate = Database['public']['Tables']['system_templates']['Row'];
type SystemTemplateInsert = Database['public']['Tables']['system_templates']['Insert'];
type SystemTemplateUpdate = Database['public']['Tables']['system_templates']['Update'];

export const useSystemTemplates = () => {
  return useQuery({
    queryKey: ['system-templates'],
    queryFn: () => systemTemplatesApi.getSystemTemplates(),
  });
};

export const useSystemTemplate = (id: string) => {
  return useQuery({
    queryKey: ['system-template', id],
    queryFn: () => systemTemplatesApi.getSystemTemplate(id),
    enabled: !!id,
  });
};

export const useCreateSystemTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (template: SystemTemplateInsert) =>
      systemTemplatesApi.createSystemTemplate(template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-templates'] });
    },
  });
};

export const useUpdateSystemTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: SystemTemplateUpdate }) =>
      systemTemplatesApi.updateSystemTemplate(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-templates'] });
    },
  });
};

export const useDeleteSystemTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => systemTemplatesApi.deleteSystemTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-templates'] });
    },
  });
};
