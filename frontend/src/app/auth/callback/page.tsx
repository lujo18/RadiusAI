"use client";

import React from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/store";
import backendClient from "@/lib/api/clients/backendClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    // Handle OAuth callback
    const handleCallback = async () => {
      console.log("OAuth callback - getting session...");

      const fullUrl = window.location.href;

      // Call server-side exchange route which uses cookie-backed server client
      try {
        const res = await backendClient(
          "/api/v1/auth/exchange",
          { url: fullUrl },
        );

        console.log("GOOGLE RES", res)

        const payload =  res;
        if (!res) {
          console.error("Auth callback exchange error (server):", payload);
          router.push("/login?error=auth_failed");
          return;
        }

        // After successful server-side exchange, the client can retrieve session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Auth callback error:", sessionError);
          router.push("/login?error=auth_failed");
          return;
        }

        if (session && session.user) {
          console.log("Session found, user:", session.user.id);

          // Set auth store with session data
          const user = {
            id: session.user.id,
            name:
              session.user.user_metadata?.name ||
              session.user.email?.split("@")[0] ||
              "User",
            email: session.user.email || "",
            plan: "growth" as const, // Default to growth, will be updated after Stripe
          };

          console.log("Setting auth store...");
          login(user, session.user, session);

          // Small delay to ensure store is persisted
          await new Promise((resolve) => setTimeout(resolve, 100));

          console.log("Auth store set");

          // OAuth successful, check if we need to redirect to checkout
          const selectedPlan = localStorage.getItem("selectedPlan");
          console.log("Selected plan from storage:", selectedPlan);

          if (
            selectedPlan &&
            (selectedPlan === "growth" ||
              selectedPlan === "unlimited" ||
              selectedPlan === "starter")
          ) {
            // Clear the stored plan
            localStorage.removeItem("selectedPlan");

            // Redirect to checkout page instead of directly to Stripe
            console.log("Redirecting to checkout page...");
            router.push(`/checkout?plan=${selectedPlan}`);
            return;
          }

          // Default: redirect to dashboard
          router.push("/overview");
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error("Auth callback unexpected error:", err);
        router.push("/login?error=auth_failed");
        return;
      }
    };

    handleCallback();
  }, [router, login]);

  return (
    <div className="min-h-screen bg-dark-600 flex items-center justify-center">
      <div className="text-center">
        <div className="spinner w-12 h-12 mx-auto mb-4"></div>
        <p className="text-gray-400">Completing sign in...</p>
      </div>
    </div>
  );
}
