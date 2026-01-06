import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProfileStore {
  activeProfileId: string | null; // null = "All Profiles"
  setActiveProfileId: (profileId: string | null) => void;
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      activeProfileId: null,
      setActiveProfileId: (profileId) => set({ activeProfileId: profileId }),
    }),
    {
      name: 'profile-storage',
    }
  )
);
