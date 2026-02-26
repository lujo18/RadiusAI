import { supabase } from '../client';
import type { Database } from '@/types/database';

type AppBanner = Database['public']['Tables']['app_banners']['Row'];

export class AppBannerRepository {
  /**
   * Returns ALL active banners with no location filter.
   * Callers filter client-side so TanStack Query can serve both
   * "(marketing)" and "(app)" from a single cached network request.
   */
  static async getActiveBanners(): Promise<AppBanner[]> {
    const { data, error } = await supabase
      .from('app_banners')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  }
}
