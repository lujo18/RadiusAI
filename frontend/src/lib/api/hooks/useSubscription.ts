import { useQuery, useMutation } from "@tanstack/react-query";
import { billingApi } from "@/lib/api/client";
import { useUserProfile } from "./useUser";

export const useSubscription = () => {
  const { data: user } = useUserProfile();

  return useQuery({
    queryKey: ["billing", "subscription"],
    queryFn: () => billingApi.getSubscription(),
    enabled: !!user,
    staleTime: 60 * 1000,
  });
};

export const useCreatePortal = () => {
  return useMutation<{ url?: string }, Error, string>({
    mutationFn: async (userId: string) => {
      const res = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to create portal');
      return data as { url?: string };
    },
  });
};

export default useSubscription;
