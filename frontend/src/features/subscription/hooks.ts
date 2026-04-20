import { useQuery, useMutation } from "@tanstack/react-query";
import { billingApi } from "@/lib/api/client";
import { useUser, useUserProfile } from "@/features/user/hooks";
import type { StripeSubscription } from "@/lib/api/types/stripe";
import PolarSubscription from "./types";

export const useSubscription = () => {
  const { data: user } = useUserProfile();

  return useQuery<PolarSubscription | null>({
    // Include expand in the cache key so queries for expanded product data are separate
    queryKey: ["billing", "subscription", "expand:product"],
    queryFn: async () => {;

      const res = await billingApi.getSubscription();
      console.log("[useSubscription] calling billingApi", res)
      return res as PolarSubscription | null;
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
