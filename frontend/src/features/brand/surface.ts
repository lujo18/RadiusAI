import { brandService } from '@/features/brand/services';

export const brandApi = {
  startSocialConnect: async ({ late_profile_id, brand_id, platform }: { late_profile_id: string; brand_id: string; platform: string }) => {
    return await brandService.startSocialConnect({ late_profile_id, brand_id, platform });
  },

  disconnectSocialAccount: async ({ integration_id }: { integration_id: string }) => {
    return await brandService.disconnectSocialAccount({ integration_id });
  },

  checkConnectionStatus: async (connectToken: string) => {
    return await brandService.checkConnectionStatus(connectToken);
  },

  cancelConnection: async (connectToken: string) => {
    return await brandService.cancelConnection(connectToken);
  },
};

export default brandApi;
