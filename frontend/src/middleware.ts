import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

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

  const isTeamRoute = /^\/(?!checkout)([^/]+)(?:\/|$)/.test(request.nextUrl.pathname);
  // Protected routes
  const otherProtectedRoutes = ['/[teamId]', '/[brandId]', '/overview', '/brand', '/templates', '/slides', '/checkout', '/account'];
  const isProtectedRoute = isTeamRoute || otherProtectedRoutes.some(route => 
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
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Subscription is enforced at the feature level (FeatureLock), not at the route level.
  // Authenticated users without an active subscription can browse the dashboard freely.

  return response;
}

export const config = {
  matcher: [
    '/brand/:path*',
  ],
};
