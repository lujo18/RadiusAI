import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;


if (!supabaseUrl || !supabaseKey) {
  console.log(supabaseUrl, supabaseKey)
  throw new Error('Missing Supabase environment variables. Please check .env.local file.');
}

export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseKey);