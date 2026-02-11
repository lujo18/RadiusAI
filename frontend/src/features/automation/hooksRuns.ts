import { useQuery } from '@tanstack/react-query';
import { automationRunApi } from '@/features/automation/surfaceRuns';
import type { Database } from '@/types/database';

type AutomationRunRow = Database['public']['Tables']['automation_runs']['Row'];

/** Query key factory for automation runs */
export const automationRunKeys = {
  all: ['automationRuns'] as const,
  lists: () => [...automationRunKeys.all, 'list'] as const,
  list: (automationId: string) => [...automationRunKeys.lists(), { automationId }] as const,
  listByBrand: (brandId: string) => [...automationRunKeys.lists(), { brandId }] as const,
  details: () => [...automationRunKeys.all, 'detail'] as const,
  detail: (id: string) => [...automationRunKeys.details(), id] as const,
  latest: (automationId: string) => [...automationRunKeys.all, 'latest', automationId] as const,
  successful: (automationId: string) => [...automationRunKeys.all, 'successful', automationId] as const,
  failed: (automationId: string) => [...automationRunKeys.all, 'failed', automationId] as const,
  successRate: (automationId: string, days?: number) =>
    [...automationRunKeys.all, 'successRate', automationId, days] as const,
};

/** Fetch all runs for an automation */
export function useAutomationRuns(
  automationId: string | null | undefined,
  limit?: number,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: automationRunKeys.list(automationId || ''),
    queryFn: () => (automationId ? automationRunApi.list(automationId, limit) : Promise.resolve([])),
    enabled: !!automationId && (options?.enabled !== false),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/** Fetch all runs for a brand (across all automations) */
export function useAutomationRunsByBrand(
  brandId: string | null | undefined,
  limit?: number,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: automationRunKeys.listByBrand(brandId || ''),
    queryFn: () => (brandId ? automationRunApi.listByBrand(brandId, limit) : Promise.resolve([])),
    enabled: !!brandId && (options?.enabled !== false),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/** Fetch a single automation run */
export function useAutomationRun(
  id: string | null | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: automationRunKeys.detail(id || ''),
    queryFn: () => (id ? automationRunApi.get(id) : Promise.resolve(null)),
    enabled: !!id && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/** Fetch the latest run for an automation */
export function useLatestAutomationRun(
  automationId: string | null | undefined,
  options?: { enabled?: boolean; refetchInterval?: number }
) {
  return useQuery({
    queryKey: automationRunKeys.latest(automationId || ''),
    queryFn: () => (automationId ? automationRunApi.getLatest(automationId) : Promise.resolve(null)),
    enabled: !!automationId && (options?.enabled !== false),
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: options?.refetchInterval || false,
  });
}

/** Fetch successful runs for an automation */
export function useSuccessfulAutomationRuns(
  automationId: string | null | undefined,
  limit?: number,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: automationRunKeys.successful(automationId || ''),
    queryFn: () => (automationId ? automationRunApi.listSuccessful(automationId, limit) : Promise.resolve([])),
    enabled: !!automationId && (options?.enabled !== false),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/** Fetch failed runs for an automation */
export function useFailedAutomationRuns(
  automationId: string | null | undefined,
  limit?: number,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: automationRunKeys.failed(automationId || ''),
    queryFn: () => (automationId ? automationRunApi.listFailed(automationId, limit) : Promise.resolve([])),
    enabled: !!automationId && (options?.enabled !== false),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/** Fetch success rate metrics for an automation */
export function useAutomationSuccessRate(
  automationId: string | null | undefined,
  days?: number,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: automationRunKeys.successRate(automationId || '', days),
    queryFn: () =>
      automationId
        ? automationRunApi.getSuccessRate(automationId, days)
        : Promise.resolve({ total: 0, successes: 0, failures: 0, rate: 0 }),
    enabled: !!automationId && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
