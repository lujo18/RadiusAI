import { useQuery, useMutation } from "@tanstack/react-query";
import { billingApi } from "@/lib/api/client";
import { useUser, useUserProfile } from "@/features/user/hooks";
import type { StripeSubscription } from "@/lib/api/types/stripe";

export const useSubscription = () => {
  const { data: user } = useUserProfile();

  return useQuery<StripeSubscription | null>({
    // Include expand in the cache key so queries for expanded product data are separate
    queryKey: ["billing", "subscription", "expand:product"],
    queryFn: async () => {
      console.log("[useSubscription] calling billingApi");

      // Request expanded subscription including the product layer.
      // Backend will normalize and attach product objects if full product expansion
      // is requested (it may translate deep expands to safe backend fetches).
      const expand = [
        "data.customer",
        "data.items.data.price.product",
        "data.default_payment_method",
        "data.default_source",
      ];

      const res = await billingApi.getSubscription(expand);
      return (res && res.subscription) ?? null;
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
