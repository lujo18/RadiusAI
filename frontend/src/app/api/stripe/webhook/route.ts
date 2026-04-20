import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

    // Forward the raw body and Stripe signature header to backend webhook handler
    const body = await req.text();
    const sig = req.headers.get('stripe-signature') || '';

    const resp = await fetch(`${apiBase}/api/v1/billing/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': sig,
      },
      body,
    });

    const data = await resp.text().catch(() => null);
    const returnBody = (() => {
      try {
        return JSON.parse(data as string);
      } catch {
        return { forwarded: true, raw: data };
      }
    })();

    return NextResponse.json(returnBody, { status: resp.status });
  } catch (err) {
    console.error('[Webhook] Proxy failed:', err);
    return NextResponse.json({ error: 'Webhook proxy failed' }, { status: 500 });
  }
}
