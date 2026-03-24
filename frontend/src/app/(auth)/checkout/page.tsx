"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from '@/components/ui/button';
import { supabase } from "@/lib/supabase/client";
import { FiLoader, FiAlertCircle } from "react-icons/fi";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "growth";
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const createCheckoutSession = async () => {
      try {
        console.log('[Checkout] Starting checkout flow for plan:', plan);
        
        // Verify user has valid session by making API call
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        console.log('[Checkout] User check result:', {
          hasUser: !!user,
          userId: user?.id,
          error: error?.message
        });

        if (!user || error) {
          // Not logged in or invalid session, redirect to signup
          console.log('[Checkout] No valid user - REDIRECTING TO SIGNUP');
          router.push(`/signup?plan=${plan}`);
          return;
        }

        console.log('[Checkout] User authenticated, creating Stripe session...');

        // Check if user already has an active subscription
        const { data: userData } = await supabase
          .from('users')
          .select('subscription_status, stripe_subscription_id')
          .eq('id', user.id)
          .single();

        if (userData?.subscription_status === 'active' && userData?.stripe_subscription_id) {
          console.log('[Checkout] User already has active subscription - redirecting to dashboard');
          router.push('/overview?message=already_subscribed');
          return;
        }

        // Get product ID for the selected plan
        const productMap: Record<string, string> = {
          starter: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_STARTER!,
          growth: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_GROWTH!,
          unlimited: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_UNLIMITED!,
        };

        const productId = productMap[plan];

        console.log('[Checkout] Product mapping:', { plan, productId });

        if (!productId) {
          console.error('[Checkout] Invalid plan selected:', plan);
          setError("Invalid plan selected");
          setIsLoading(false);
          return;
        }

        // Create Stripe checkout session via backend billing service
        const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
        // Create Stripe checkout session
        const res = await fetch(`${apiBase}/api/billing/checkout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_id: productId,
            user_id: user.id,
            plan,
          }),
        });

        const data = (await res.json()) as { url?: string };

        console.log('[Checkout] Stripe API response:', { hasUrl: !!data.url });

        if (data.url) {
          // Redirect to Stripe Checkout
          console.log('[Checkout] Redirecting to Stripe...');
          window.location.href = data.url;
        } else {
          console.error('[Checkout] No URL in response:', data);
          setError("Failed to create checkout session");
          setIsLoading(false);
        }
      } catch (err) {
        console.error("[Checkout] Error:", err);
        setError("An error occurred while creating your checkout session");
        setIsLoading(false);
      }
    };

    createCheckoutSession();
  }, [router, plan]);

  if (error) {
    return (
      <div className="min-h-screen bg-dark-600 flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-md w-full text-center">
          <FiAlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold font-main text-foreground mb-2">Checkout Error</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button
            onClick={() => router.push("/pricing")}
            className="btn-primary w-full"
          >
            Back to Pricing
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-600 flex items-center justify-center">
      <div className="text-center">
        <FiLoader className="w-12 h-12 text-primary-400 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold font-main text-foreground mb-2">
          Creating your checkout session...
        </h2>
        <p className="text-gray-400">
          You'll be redirected to Stripe in a moment
        </p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-dark-600 flex items-center justify-center">
        <div className="text-center">
          <FiLoader className="w-12 h-12 text-primary-400 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold font-main text-foreground mb-2">
            Loading checkout...
          </h2>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
