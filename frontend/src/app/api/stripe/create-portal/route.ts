import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

    // Proxy to backend unified billing portal endpoint.
    const resp = await fetch(`${apiBase}/api/v1/billing/portal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await resp.json().catch(() => ({ error: 'Invalid backend response' }));
    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    console.error('Error proxying create-portal:', error);
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 });
  }
}
