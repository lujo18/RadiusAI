import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Use service role key for admin operations (bypasses RLS)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Helper to update user subscription data
async function updateUserSubscription(
  userId: string,
  data: {
    stripe_customer_id?: string;
    stripe_subscription_id?: string | null;
    subscription_status?: string | null;
    subscription_plan?: string | null;
    current_period_end?: string | null;
  }
) {
  console.log("[Webhook] Updating user:", userId, "with data:", data);

  const { data: result, error } = await supabase
    .from("users")
    .update(data)
    .eq("id", userId)
    .select();

  if (error) {
    console.error("[Webhook] Error updating user:", error);
    throw error;
  }

  console.log("[Webhook] Update result:", result);
  return result;
}

// Helper to find user by Stripe IDs
async function findUserByStripeIds(
  subscriptionId?: string,
  customerId?: string
): Promise<string | null> {
  // Try by subscription ID first
  if (subscriptionId) {
    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("stripe_subscription_id", subscriptionId)
      .single();

    if (data?.id) {
      console.log("[Webhook] Found user by subscription_id:", data.id);
      return data.id;
    }
  }

  // Try by customer ID
  if (customerId) {
    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (data?.id) {
      console.log("[Webhook] Found user by customer_id:", data.id);
      return data.id;
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  console.log("[Webhook] ========== WEBHOOK CALLED ==========");

  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log("[Webhook] Event verified:", event.type);
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("[Webhook] Processing event:", event.type);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const userId = session.metadata?.userId;
        const selectedPlan = session.metadata?.plan;

        if (!userId || !selectedPlan) {
          console.error("[Webhook] Missing userId or plan in session metadata");
          break;
        }

        console.log(
          `[Webhook] Processing checkout for user ${userId}, plan: ${selectedPlan}`
        );

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string,
          { expand: ["items.data.price.product"] }
        );

        console.log('[Webhook] DEBUG - Subscription keys:', Object.keys(subscription));
        const sub = subscription as Stripe.Subscription;

        const periodEnd = (subscription as any).current_period_end;
        console.log('[Webhook] DEBUG - current_period_end:', periodEnd);
        const currentPeriodEnd = periodEnd
          ? new Date(periodEnd * 1000).toISOString()
          : null;

        await updateUserSubscription(userId, {
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscription.id,
          subscription_status: subscription.status,
          subscription_plan: selectedPlan,
          current_period_end: currentPeriodEnd,
        });

        console.log(
          `✅ Subscription created for user ${userId} - Plan: ${selectedPlan}`
        );
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        const userId = await findUserByStripeIds(
          subscription.id,
          subscription.customer as string
        );

        if (!userId) {
          console.error(
            "[Webhook] User not found for subscription:",
            subscription.id
          );
          break;
        }

        console.log(
          `[Webhook] Updating subscription for user ${userId}, status: ${subscription.status}`
        );

        const sub = subscription as Stripe.Subscription;
        const periodEnd = (sub as any).current_period_end;
        const currentPeriodEnd = periodEnd
          ? new Date(periodEnd * 1000).toISOString()
          : null;

        const updateData: Record<string, unknown> = {
          subscription_status: subscription.status,
          current_period_end: currentPeriodEnd,
        };

        // If subscription is inactive, clear subscription_plan
        if (
          [
            "canceled",
            "unpaid",
            "paused",
            "incomplete",
            "incomplete_expired",
          ].includes(subscription.status)
        ) {
          updateData.subscription_plan = null;
          console.log(
            `🚫 User ${userId} subscription inactive - clearing subscription_plan`
          );
        }

        await updateUserSubscription(userId, updateData);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        const userId = await findUserByStripeIds(
          subscription.id,
          subscription.customer as string
        );

        if (!userId) {
          console.error(
            "[Webhook] User not found for subscription:",
            subscription.id
          );
          break;
        }

        console.log(`[Webhook] Deleting subscription for user ${userId}`);

        await updateUserSubscription(userId, {
          subscription_status: "canceled",
          subscription_plan: null,
          stripe_subscription_id: null,
          current_period_end: null,
        });

        console.log(`❌ Subscription deleted for user ${userId}`);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;

        console.log("[Webhook] invoice.payment_succeeded received");

        const subscriptionId =
          typeof (invoice as any).subscription === "string"
            ? (invoice as any).subscription
            : (invoice as any).subscription?.id;

        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : (invoice.customer as Stripe.Customer)?.id;

        if (!subscriptionId) {
          console.log("[Webhook] No subscription ID in invoice, skipping");
          break;
        }

        // Get subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(
          subscriptionId,
          {
            expand: ["items.data.price.product"],
          }
        );

        // Find user
        let userId = await findUserByStripeIds(subscriptionId, customerId);

        if (!userId) {
          console.error(
            "[Webhook] User not found for subscription:",
            subscriptionId,
            "customer:",
            customerId
          );
          break;
        }

        // Get plan from metadata or product
        let plan = subscription.metadata?.plan;
        if (!plan) {
          const product = subscription.items.data[0]?.price
            ?.product as Stripe.Product;
          plan = product?.metadata?.plan || "growth";
        }

        console.log("[Webhook] Updating user:", userId, "with plan:", plan);

        const sub = subscription as Stripe.Subscription;
        const periodEnd = (sub as any).current_period_end;
        const currentPeriodEnd = periodEnd
          ? new Date(periodEnd * 1000).toISOString()
          : null;

        await updateUserSubscription(userId, {
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_status: subscription.status,
          subscription_plan: plan,
          current_period_end: currentPeriodEnd,
        });

        console.log(`✅ Payment succeeded for user ${userId} - Plan: ${plan}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        const subscriptionId =
          typeof (invoice as any).subscription === "string"
            ? (invoice as any).subscription
            : (invoice as any).subscription?.id;

        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : (invoice.customer as Stripe.Customer)?.id;

        if (!subscriptionId) break;

        const userId = await findUserByStripeIds(subscriptionId, customerId);

        if (!userId) {
          console.error(
            "[Webhook] User not found for subscription:",
            subscriptionId
          );
          break;
        }

        await updateUserSubscription(userId, {
          subscription_status: "past_due",
        });

        console.log(`⚠️ Payment failed for user ${userId}`);
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;

        // For subscription.created, we need to find user by customer ID
        // since subscription ID won't be stored yet
        const userId = await findUserByStripeIds(
          undefined,
          subscription.customer as string
        );

        if (!userId) {
          // This is normal for checkout.session.completed flow - it handles the initial setup
          console.log(
            "[Webhook] User not found for customer:",
            subscription.customer,
            "(may be handled by checkout.session.completed)"
          );
        } else {

          const sub = subscription as Stripe.Subscription;
          const periodEnd = (sub as any).current_period_end;
          const currentPeriodEnd = periodEnd
            ? new Date(periodEnd * 1000).toISOString()
            : null;

          await updateUserSubscription(userId, {
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
            current_period_end: currentPeriodEnd,
          });

          console.log(`🆕 Subscription linked for user ${userId}`);
          break;
        }
      }
      break;
      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
