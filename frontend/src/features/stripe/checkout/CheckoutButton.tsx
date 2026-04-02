import { Button } from "@/components/ui/button";
import React from "react";
import { startCheckout } from "./service";
import { getCurrentUser } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";

export enum PlanStatus {
  downgrade,
  current,
  upgrade,
}

type CheckoutButtonType = {
  planId: string;
  status: PlanStatus;
};

const CheckoutButton = ({ planId, status }: CheckoutButtonType) => {
  const router = useRouter();

  const params = useParams();

  const openCheckout = async () => {
    console.log("[Checkout] Starting checkout flow for plan:", planId);

    const user = await getCurrentUser();
    if (!user) {
      console.log("[Checkout] No valid user - redirecting to signup");
      router.push(`/signup?plan=${planId}`);
      return;
    }

    // Require a team context for checkout (external customer must be a team)
    const teamId = (params as any)?.teamId as string | undefined;
    if (!teamId) {
      console.log("[Checkout] Missing team context - redirecting to pricing");
      router.push("/pricing");
      return;
    }

    console.log("[Checkout] Team context found, creating checkout session for team:", teamId);

    // Proceed to start checkout for team (subscription checks performed server-side)

    await startCheckout(planId, window.location.href, teamId);
  };

  return (
    <Button onClick={openCheckout}>
      {status === PlanStatus.downgrade
        ? "Downgrade"
        : status === PlanStatus.current
          ? "Current Plan"
          : status === PlanStatus.upgrade
            ? "Upgrade"
            : "Select Plan"}
    </Button>
  );
};

export default CheckoutButton;
