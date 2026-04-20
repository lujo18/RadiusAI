import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

    const resp = await fetch(`${apiBase}/api/v1/billing/benefits/plans`);
    if (!resp.ok) {
      const text = await resp.text().catch(() => null);
      console.error('Backend plans fetch failed:', resp.status, text);
      return NextResponse.json({ error: 'Failed to fetch plans' }, { status: resp.status });
    }

    const data: any = await resp.json();

    // Normalize into the older shape expected by the frontend
    const priceData: any[] = [];
    const products = data?.products || [];
    for (const prod of products) {
      const prices = prod.prices || [];
      for (const price of prices) {
        priceData.push({
          id: price.id,
          productId: prod.id,
          productName: prod.name,
          description: prod.description,
          amount: price.amount ? price.amount / 100 : 0,
          currency: price.currency,
          interval: price.interval || prod.billing_period || null,
          metadata: price.metadata || prod.metadata || {},
        });
      }
    }

    // Keep the old convenience plan mapping for compatibility
    const plans = {
      starter: priceData.find((p) => p.productName?.toLowerCase().includes('starter')),
      growth: priceData.find((p) => p.productName?.toLowerCase().includes('growth')),
      unlimited: priceData.find((p) => p.productName?.toLowerCase().includes('unlimited')),
    };

    return NextResponse.json({ prices: priceData, plans });
  } catch (error) {
    console.error('Error fetching plans proxy:', error);
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
}
