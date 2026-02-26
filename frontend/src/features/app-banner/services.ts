import { AppBannerRepository } from '@/lib/supabase/repos/AppBannerRepository';

export const appBannerService = {
  /** Fetches all active banners (unfiltered by location). */
  async getActiveBanners() {
    return AppBannerRepository.getActiveBanners();
  },
};
