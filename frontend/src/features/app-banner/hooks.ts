import { useQuery } from '@tanstack/react-query';
import { appBannerService } from './services';
import type { Database } from '@/types/database';

export type AppBanner = Database['public']['Tables']['app_banners']['Row'];
export type BannerLocation = Database['public']['Enums']['app_banner_location'];

/**
 * Fetches ALL active banners and caches them globally.
 * Both layout locations share this one query — zero duplicate Supabase calls.
 * Banners are refetched at most once per 10 minutes (staleTime) since they
 * change very rarely, preventing unnecessary roundtrips for every user page visit.
 */
export const useActiveBanners = () => {
  return useQuery({
    queryKey: ['app-banners', 'active'],
    queryFn: () => appBannerService.getActiveBanners(),
    staleTime: 1000 * 60 * 10,   // 10 min — banners rarely change
    gcTime: 1000 * 60 * 30,      // 30 min — keep in memory across route changes
    refetchOnWindowFocus: false,  // not needed for near-static data
    retry: 1,
  });
};

/**
 * Convenience hook — returns only the banners for a given location.
 * Filtering happens client-side from the shared cached result.
 */
export const useBannersForLocation = (location: BannerLocation) => {
  const query = useActiveBanners();
  return {
    ...query,
    data: query.data?.filter((b) => b.location === location) ?? [],
  };
};
