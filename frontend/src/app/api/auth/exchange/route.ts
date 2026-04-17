import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const useServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || '';

export async function POST(request: Request) {
  try {
    const body = await request.json() as { url?: string };
    const url = body.url;
    const parsed = new URL(url || '');
    const code = parsed.searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Missing code parameter' }, { status: 400 });
    }

    if (!supabaseUrl || !supabaseKey) {
      console.error('[Auth Exchange] Missing Supabase URL or key in server environment');
      return NextResponse.json({ error: 'Server misconfiguration: missing SUPABASE keys' }, { status: 500 });
    }

    if (!useServiceKey) {
      console.warn('[Auth Exchange] SUPABASE_SERVICE_ROLE_KEY not set; falling back to publishable key (development only).');
    }

    const cookieHeader = request.headers.get('cookie') || '';
    const parseCookies = (hdr: string) => Object.fromEntries(
      hdr.split(';').map(s => s.trim()).filter(Boolean).map(s => {
        const idx = s.indexOf('=');
        if (idx === -1) return [s, ''];
        const k = s.substring(0, idx).trim();
        const v = s.substring(idx + 1).trim();
        return [k, decodeURIComponent(v)];
      })
    );

    const cookiesMap = parseCookies(cookieHeader);

    const responseCookies: Array<{
      name: string;
      value: string;
      options?: Record<string, any>;
    }> = [];

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name: string) {
          return cookiesMap[name];
        },
        set(name: string, value: string, options: any) {
          cookiesMap[name] = value;
          responseCookies.push({ name, value, options });
        },
        remove(name: string, options: any) {
          delete cookiesMap[name];
          responseCookies.push({ name, value: '', options });
        },
      },
    });

    // Perform the server-side exchange using cookie-backed storage
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[Auth Exchange] error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Success: return minimal success payload and forward any cookies written by Supabase
    const response = NextResponse.json({ success: true });

    // Normalize and apply cookies to the outgoing response. Adjust insecure cookie flags for localhost.
    const host = (request.headers.get('host') || '').toLowerCase();
    const isLocalhost = host.startsWith('localhost') || host.startsWith('127.0.0.1') || host.includes('localhost');

    for (const cookie of responseCookies) {
      const opts = cookie.options || {};
      let secure = typeof opts.secure === 'boolean' ? opts.secure : (process.env.NODE_ENV === 'production');
      let sameSite = opts.sameSite ?? (process.env.NODE_ENV === 'production' ? 'none' : 'lax');

      if (isLocalhost && secure) {
        secure = false;
        if (sameSite === 'none') sameSite = 'lax';
      }

      try {
        response.cookies.set({
          name: cookie.name,
          value: cookie.value,
          path: opts.path || '/',
          httpOnly: opts.httpOnly ?? true,
          secure,
          sameSite: sameSite as 'lax' | 'strict' | 'none',
          maxAge: opts.maxAge ?? undefined,
          domain: opts.domain ?? undefined,
        });
      } catch (e) {
        // Fallback: attempt to set by spreading raw options if normalization fails
        try {
          response.cookies.set({ name: cookie.name, value: cookie.value, ...(cookie.options || {}) as any });
        } catch (err) {
          console.error('[Auth Exchange] failed to set cookie on response', err);
        }
      }
    }

    return response;
  } catch (err: any) {
    console.error('[Auth Exchange] unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
