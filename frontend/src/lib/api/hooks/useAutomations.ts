import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { automationApi } from '@/lib/api/surface/automationApi';
import type { Database } from '@/types/database';

type AutomationRow = Database['public']['Tables']['automations']['Row'];
type AutomationInsert = Database['public']['Tables']['automations']['Insert'];
type AutomationUpdate = Database['public']['Tables']['automations']['Update'];

/** Query key factory for automations */
export const automationKeys = {
  all: ['automations'] as const,
  lists: () => [...automationKeys.all, 'list'] as const,
  list: (brandId: string) => [...automationKeys.lists(), { brandId }] as const,
  details: () => [...automationKeys.all, 'detail'] as const,
  detail: (id: string) => [...automationKeys.details(), id] as const,
};

/** Fetch automations for a brand */
export function useAutomations(
  brandId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: automationKeys.list(brandId || ''),
    queryFn: () => (brandId ? automationApi.list(brandId) : Promise.resolve([])),
    enabled: !!brandId && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/** Fetch a single automation */
export function useAutomation(id: string | null | undefined) {
  return useQuery({
    queryKey: automationKeys.detail(id || ''),
    queryFn: () => (id ? automationApi.get(id) : Promise.resolve(null)),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/** Create a new automation */
export function useCreateAutomation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ brandId, payload }: { brandId: string; payload: Omit<AutomationInsert, 'brand_id'> }) => {
      payload = {...payload, "user_timezone": Intl.DateTimeFormat().resolvedOptions().timeZone};
      return automationApi.create(brandId, payload);
    },
    onSuccess: (data) => {
      // Invalidate the automations list for the brand
      queryClient.invalidateQueries({
        queryKey: automationKeys.lists(),
      });
      // Set the detail query
      queryClient.setQueryData(automationKeys.detail(data.id), data);
    },
  });
}

/** Update an automation */
export function useUpdateAutomation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: AutomationUpdate }) => {
      return automationApi.update(id, updates);
    },
    onSuccess: (data) => {
      // Update the detail query
      queryClient.setQueryData(automationKeys.detail(data.id), data);
      // Invalidate the lists to refetch
      queryClient.invalidateQueries({
        queryKey: automationKeys.lists(),
      });
    },
  });
}

/** Delete an automation */
export function useDeleteAutomation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return automationApi.delete(id);
    },
    onSuccess: (_, id) => {
      // Remove from detail cache
      queryClient.removeQueries({
        queryKey: automationKeys.detail(id),
      });
      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: automationKeys.lists(),
      });
    },
  });
}

/** Toggle automation active status */
export function useToggleAutomationActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return automationApi.toggleActive(id, isActive);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(automationKeys.detail(data.id), data);
      queryClient.invalidateQueries({
        queryKey: automationKeys.lists(),
      });
    },
  });
}

/** Update automation schedule */
export function useUpdateAutomationSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, schedule }: { id: string; schedule: Record<string, string[]> }) => {
      return automationApi.updateSchedule(id, schedule);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(automationKeys.detail(data.id), data);
      queryClient.invalidateQueries({
        queryKey: automationKeys.lists(),
      });
    },
  });
}

/** Update automation next run time */
export function useUpdateAutomationNextRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, nextRunAt }: { id: string; nextRunAt: string }) => {
      return automationApi.updateNextRun(id, nextRunAt);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(automationKeys.detail(data.id), data);
      queryClient.invalidateQueries({
        queryKey: automationKeys.lists(),
      });
    },
  });
}
