import userService from '@/lib/api/services/userService';

export const userApi = {
  getProfile: async () => {
    return await userService.getProfile();
  },

  updateProfile: async (updates: any) => {
    return await userService.updateProfile(updates);
  },

  getConnectedAccounts: async () => {
    return await userService.getConnectedAccounts();
  },
};

export default userApi;
