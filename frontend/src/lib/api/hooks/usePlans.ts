import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plansApi } from '@/lib/api/client';

type Plan = {
  id: string;
  plan_id: string;
  name: string;
  max_brands: number | null;
  max_posts_per_month: number | null;
  max_slides_per_month: number | null;
  ai_credits?: number | null;
};
type PlanInsert = Omit<Plan, 'id'>;
type PlanUpdate = Partial<PlanInsert>;

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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (plan: PlanInsert) => plansApi.createPlan(plan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
};

export const useUpdatePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, updates }: { planId: string; updates: PlanUpdate }) =>
      plansApi.updatePlan(planId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
};

export const useDeletePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => plansApi.deletePlan(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
};
