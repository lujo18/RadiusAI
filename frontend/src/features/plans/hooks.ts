import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plansApi } from '@/lib/api/client';
import type { Database } from '@/types/database';

// Some environments may not have `plans` table in generated Database types yet.
// Use `any` fallback to keep the build moving; replace with strict types later.
type Plan = any;
type PlanInsert = any;
type PlanUpdate = any;

export const usePlans = () => {
  return useQuery({
    queryKey: ['plans'],
    queryFn: () => plansApi.getPlans(),
  });
};

export const usePlan = (planId: string) => {
  return useQuery({
    queryKey: ['plan', planId],
    queryFn: () => plansApi.getPlan(planId),
    enabled: !!planId,
  });
};

export const useCreatePlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (plan: PlanInsert) => plansApi.createPlan(plan),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  });
};

export const useUpdatePlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, updates }: { planId: string; updates: PlanUpdate }) => plansApi.updatePlan(planId, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  });
};

export const useDeletePlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => plansApi.deletePlan(planId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  });
};
