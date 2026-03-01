import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plansApi } from '@/lib/api/client';

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
    mutationFn: (data: any) => plansApi.createPlan(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
  });
};

export const useUpdatePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, updates }: { planId: string; updates?: any }) =>
      plansApi.updatePlan(planId, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
  });
};

export const useDeletePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => plansApi.deletePlan(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
  });
};
