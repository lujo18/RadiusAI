import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BrandStore {
  activeBrandId: string | null; // null = "All Brands" (overview)
  setActiveBrandId: (brandId: string | null) => void;
}

export const useBrandStore = create<BrandStore>()(
  persist(
    (set) => ({
      activeBrandId: null,
      setActiveBrandId: (brandId) => set({ activeBrandId: brandId }),
    }),
    {
      name: 'brand-storage',
    }
  )
);
