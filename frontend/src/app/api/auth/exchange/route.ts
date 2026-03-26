import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

export async function POST(request: Request) {
  try {
    const body = await request.json() as { url?: string };
    const url = body.url;
    const parsed = new URL(url || '');
    const code = parsed.searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Missing code parameter' }, { status: 400 });
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

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name: string) {
          return cookiesMap[name];
        },
        set() {
          // no-op in this route; middleware handles setting cookies
        },
        remove() {
          // no-op
        },
      },
    });

    // Perform the server-side exchange using cookie-backed storage
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[Auth Exchange] error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Success: return minimal success payload. The cookies should now contain session info.
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Auth Exchange] unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
