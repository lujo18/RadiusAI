import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

// Use service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Get subscription details with expand
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string,
          { expand: ['items.data.price.product'] }
        );

        const userId = session.metadata?.userId;
        const selectedPlan = session.metadata?.plan; // 'starter', 'growth', or 'unlimited'

        if (!userId || !selectedPlan) {
          console.error('Missing userId or plan in session metadata');
          break;
        }

        console.log(`[Webhook] Processing checkout for user ${userId}, plan: ${selectedPlan}`);

        // Update profile with Stripe IDs and subscription details
        await supabaseAdmin
          .from('profiles')
          .update({
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
            subscription_plan: selectedPlan,
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
          })
          .eq('user_id', userId);

        // Update user's plan in users table
        await supabaseAdmin
          .from('users')
          .update({
            plan: selectedPlan as 'starter' | 'growth' | 'unlimited',
          })
          .eq('id', userId);

        console.log(`✅ Subscription created for user ${userId} - Plan: ${selectedPlan}, Status: ${subscription.status}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        // Find user by Stripe subscription ID
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (!profile) {
          console.error('Profile not found for subscription:', subscription.id);
          break;
        }

        console.log(`[Webhook] Updating subscription for user ${profile.user_id}, status: ${subscription.status}`);

        // Update subscription status and period end
        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: subscription.status,
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
          })
          .eq('user_id', profile.user_id);

        // If subscription is canceled or paused, set plan to null
        if (['canceled', 'unpaid', 'paused', 'incomplete', 'incomplete_expired'].includes(subscription.status)) {
          await supabaseAdmin
            .from('users')
            .update({ plan: null })
            .eq('id', profile.user_id);
          
          console.log(`🚫 User ${profile.user_id} subscription inactive - plan set to null, dashboard access blocked`);
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        // Find user by Stripe subscription ID
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (!profile) {
          console.error('Profile not found for subscription:', subscription.id);
          break;
        }

        console.log(`[Webhook] Deleting subscription for user ${profile.user_id}`);

        // Mark subscription as canceled and clear data
        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: 'canceled',
            subscription_plan: null,
            stripe_subscription_id: null,
            current_period_end: null,
          })
          .eq('user_id', profile.user_id);

        // Set user plan to null (no active subscription)
        await supabaseAdmin
          .from('users')
          .update({ plan: null })
          .eq('id', profile.user_id);

        console.log(`Subscription canceled for user ${profile.user_id}`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | Stripe.Subscription };
        
        const subscriptionId = typeof invoice.subscription === 'string' 
          ? invoice.subscription 
          : invoice.subscription?.id;

        if (!subscriptionId) break;

        // Find user by Stripe subscription ID
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('user_id')
          .eq('stripe_subscription_id', subscriptionId)
          .single();

        if (!profile) {
          console.error('Profile not found for subscription:', subscriptionId);
          break;
        }

        // Update subscription status to active after successful payment
        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: 'active',
          })
          .eq('user_id', profile.user_id);

        console.log(`✅ Payment succeeded for user ${profile.user_id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | Stripe.Subscription };
        
        const subscriptionId = typeof invoice.subscription === 'string' 
          ? invoice.subscription 
          : invoice.subscription?.id;

        if (!subscriptionId) break;

        // Find user by Stripe subscription ID
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('user_id')
          .eq('stripe_subscription_id', subscriptionId)
          .single();

        if (!profile) {
          console.error('Profile not found for subscription:', subscriptionId);
          break;
        }

        // Mark subscription as past_due
        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: 'past_due',
          })
          .eq('user_id', profile.user_id);

        console.log(`⚠️ Payment failed for user ${profile.user_id}`);
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;

        // Find user by Stripe customer ID
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('user_id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single();

        if (!profile) {
          console.error('Profile not found for customer:', subscription.customer);
          break;
        }

        // Update subscription details
        await supabaseAdmin
          .from('profiles')
          .update({
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
          })
          .eq('user_id', profile.user_id);

        console.log(`🆕 Subscription created for user ${profile.user_id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
