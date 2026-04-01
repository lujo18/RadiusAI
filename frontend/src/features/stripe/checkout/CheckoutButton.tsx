import { Button } from "@/components/ui/button";
import React from "react";
import { startCheckout } from "./service";
import { getCurrentUser } from "@/lib/supabase/auth";

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
  const openCheckout = () => {
    console.log("[Checkout] Starting checkout flow for plan:", plan);


    const user = getCurrentUser();

    // if (!user || error) {
    //   // Not logged in or invalid session, redirect to signup
    //   console.log('[Checkout] No valid user - REDIRECTING TO SIGNUP');
    //   router.push(`/signup?plan=${plan}`);
    //   return;
    // }

    console.log("[Checkout] User authenticated, creating Stripe session...");

    // Check if user already has an active subscription
    const { data: userData } = await supabase
      .from("users")
      .select("subscription_status, stripe_subscription_id")
      .eq("id", user.id)
      .single();

    if (
      userData?.subscription_status === "active" &&
      userData?.stripe_subscription_id
    ) {
      console.log(
        "[Checkout] User already has active subscription - redirecting to dashboard",
      );
      router.push("/overview?message=already_subscribed");
      return;
    }
    startCheckout(planId, window.location.href);
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
