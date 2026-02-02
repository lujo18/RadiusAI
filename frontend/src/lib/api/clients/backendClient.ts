import axios from 'axios';
import { supabase } from '@/lib/supabase/client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export const backendClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

backendClient.interceptors.request.use(async (cfg) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    // Avoid replacing Axios headers object; assign Authorization field
    if (cfg.headers) {
      (cfg.headers as Record<string, string>)['Authorization'] = `Bearer ${session.access_token}`;
    } else {
      // eslint-disable-next-line no-param-reassign
      cfg.headers = { Authorization: `Bearer ${session.access_token}` } as any;
    }
  }
  return cfg;
});

export default backendClient;
