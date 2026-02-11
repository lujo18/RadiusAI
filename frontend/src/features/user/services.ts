import { UserRepository } from '@/lib/supabase/repos/UserRepository';
import { requireUserId } from '@/lib/supabase/auth';
import type { Database } from '@/types/database';

const userService = {
  async getProfile() {
    const userId = await requireUserId();
    return await UserRepository.getUser(userId);
  },

  async updateProfile(updates: Partial<Database['public']['Tables']['users']['Update']>) {
    const userId = await requireUserId();
    return await UserRepository.updateUser(userId, updates as any);
  },

  async getConnectedAccounts() {
    // Placeholder: backend currently handles connected accounts
    throw new Error('getConnectedAccounts not implemented');
  },
};

export default userService;
