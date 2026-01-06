import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  // Create a Supabase client configured to use cookies
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Check for authenticated user (getUser() is more secure than getSession())
  const { data: { user }, error } = await supabase.auth.getUser();
  
  console.log('[Middleware] Auth check:', {
    path: request.nextUrl.pathname,
    hasUser: !!user,
    authError: error?.message,
    userId: user?.id
  });

  // Protected routes
  const protectedRoutes = ['/brand'];
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  // Allow Stripe success redirects to pass through (they'll handle auth client-side)
  const hasStripeSessionId = request.nextUrl.searchParams.has('session_id');
  
  console.log('[Middleware] Route protection check:', {
    isProtectedRoute,
    hasStripeSessionId,
    willRedirect: isProtectedRoute && !user && !hasStripeSessionId
  });
  
  // Check if user is trying to access protected route
  if (isProtectedRoute && !user && !hasStripeSessionId) {
    console.log('[Middleware] Redirecting to login - no valid user');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check subscription status for authenticated users accessing dashboard
  if (isProtectedRoute && user && !hasStripeSessionId) {
    console.log('[Middleware] Checking subscription status for user:', user.id);
    
    // Use service role key to query users table (RLS bypass for middleware)
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: userData, error: userError } = await serviceSupabase
      .from('users')
      .select('subscription_status')
      .eq('id', user.id)
      .single();

    console.log('[Middleware] Subscription check:', {
      userId: user.id,
      subscriptionStatus: userData?.subscription_status,
      error: userError?.message
    });

    // Block access if no active subscription (null, inactive, canceled, etc.)
    const validStatuses = ['active', 'trialing'];
    if (!userData?.subscription_status || !validStatuses.includes(userData.subscription_status)) {
      console.log('[Middleware] Blocking access - no active subscription');
      const pricingUrl = new URL('/pricing', request.url);
      pricingUrl.searchParams.set('reason', 'subscription_required');
      return NextResponse.redirect(pricingUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/brand/:path*',
  ],
};
