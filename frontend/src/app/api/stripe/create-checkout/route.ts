import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, priceId: directPriceId, userId, plan } = body;

    if (!userId || !plan) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and plan are required' },
        { status: 400 }
      );
    }

    // Check if user already has an active subscription
    const { data: user } = await supabase
      .from('users')
      .select('subscription_status, stripe_subscription_id')
      .eq('id', userId)
      .single();

    if (user?.subscription_status === 'active' && user?.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'You already have an active subscription. Please manage it from your dashboard settings.' },
        { status: 400 }
      );
    }

    if (!productId && !directPriceId) {
      return NextResponse.json(
        { error: 'Missing required fields: either productId or priceId is required' },
        { status: 400 }
      );
    }

    let priceId = directPriceId;

    // If productId is provided, look up the price
    if (productId && !priceId) {
      const prices = await stripe.prices.list({
        product: productId,
        active: true,
        type: 'recurring',
      });

      if (!prices.data.length) {
        return NextResponse.json(
          { error: 'No active price found for this product' },
          { status: 400 }
        );
      }

      priceId = prices.data[0].id;
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&onboarding=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
      client_reference_id: userId,
      metadata: {
        userId,
        plan,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
