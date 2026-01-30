import { useQuery, useMutation } from "@tanstack/react-query";
import { billingApi } from "@/lib/api/client";
import { useUserProfile } from "./useUser";

export const useSubscription = () => {
  const { data: user } = useUserProfile();

  return useQuery({
    queryKey: ["billing", "subscription"],
    queryFn: async () => {
      const res = await billingApi.getSubscription();
      return res?.subscription ?? null;
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });
};

export const useCreatePortal = () => {
  return useMutation<{ url?: string }, Error, string>({
    mutationFn: async (userId: string) => {
      const res = await billingApi.createPortal(userId);
      return res as { url?: string };
    },
  });
};

export default useSubscription;
