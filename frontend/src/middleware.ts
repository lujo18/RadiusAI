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

  // Check for Supabase session
  const { data: { session }, error } = await supabase.auth.getSession();
  
  console.log('[Middleware] Auth check:', {
    path: request.nextUrl.pathname,
    hasSession: !!session,
    sessionError: error?.message,
    userId: session?.user?.id
  });

  // Protected routes
  const protectedRoutes = ['/dashboard'];
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  // Allow Stripe success redirects to pass through (they'll handle auth client-side)
  const hasStripeSessionId = request.nextUrl.searchParams.has('session_id');
  
  console.log('[Middleware] Route protection check:', {
    isProtectedRoute,
    hasStripeSessionId,
    willRedirect: isProtectedRoute && !session && !hasStripeSessionId
  });
  
  // Check if user is trying to access protected route
  if (isProtectedRoute && !session && !hasStripeSessionId) {
    console.log('[Middleware] Redirecting to login - no valid session');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
  ],
};
