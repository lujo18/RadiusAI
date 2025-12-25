import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export async function GET() {
  try {
    // Fetch all active prices with their products
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
    });

    // Transform into a more usable format
    const priceData = prices.data.map((price) => {
      const product = price.product as Stripe.Product;
      
      return {
        id: price.id,
        productId: product.id,
        productName: product.name,
        description: product.description,
        amount: price.unit_amount ? price.unit_amount / 100 : 0, // Convert cents to dollars
        currency: price.currency,
        interval: price.recurring?.interval,
        metadata: product.metadata,
      };
    });

    // Group by product name to identify plans
    const plans = {
      starter: priceData.find(p => p.productName.toLowerCase().includes('starter')),
      growth: priceData.find(p => p.productName.toLowerCase().includes('growth')),
      unlimited: priceData.find(p => p.productName.toLowerCase().includes('unlimited')),
    };

    return NextResponse.json({
      prices: priceData,
      plans,
    });
  } catch (error) {
    console.error('Error fetching Stripe prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    );
  }
}
