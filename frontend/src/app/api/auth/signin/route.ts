import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

export async function POST(req: Request) {
  try {
    const body = await req.json() as { provider?: string; redirectTo?: string };
    const provider = body.provider;
    const redirectTo = body.redirectTo;

    if (!provider) {
      return NextResponse.json({ error: 'Missing provider' }, { status: 400 });
    }

    const cookieHeader = req.headers.get('cookie') || '';

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
      options?: Record<string, unknown>;
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

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_APP_URL || ''}/auth/callback`,
      },
    });

    if (error) {
      console.error('[Auth SignIn] error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const url = (data as any)?.url;
    const response = NextResponse.json({ success: true, url: url || null });

    for (const cookie of responseCookies) {
      response.cookies.set({
        name: cookie.name,
        value: cookie.value,
        ...(cookie.options || {}),
      });
    }

    return response;
  } catch (err: any) {
    console.error('[Auth SignIn] unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
