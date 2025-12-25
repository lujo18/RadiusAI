/**
 * Example Protected API Route with Subscription Check
 * 
 * This demonstrates how to protect API routes with subscription validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireActiveSubscription } from '@/lib/supabase/subscriptions';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Get user from request (example - adjust based on your auth setup)
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ✅ ENFORCE SUBSCRIPTION PAYWALL
    try {
      await requireActiveSubscription(userId);
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Active subscription required',
          code: 'SUBSCRIPTION_REQUIRED'
        },
        { status: 403 }
      );
    }

    // Your protected logic here
    // User has active subscription, proceed with the request

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
