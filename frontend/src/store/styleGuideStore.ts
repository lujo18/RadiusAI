import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StyleGuideState {
  content: string;
  lastUpdated: Date | null;
  isDirty: boolean; // Has unsaved changes
  
  // Actions
  setContent: (content: string) => void;
  saveContent: (content: string) => void;
  resetToDefault: () => void;
  markClean: () => void;
}

const DEFAULT_STYLE_GUIDE = `All carousels are 10 slides max. Background: minimalist dark gradient #0f0f0f → #1a1a1a. Font: Inter Bold 48pt white with subtle drop shadow. First slide: bold hook question. Slides 2-8: value bullets with emoji. Last slide: CTA "Save this if..." + your @. Color accent: #ff4f8b pink. Tone: direct, bro-science, high-energy. Never use the word "journey".`;

export const useStyleGuideStore = create<StyleGuideState>()(
  persist(
    (set) => ({
      content: DEFAULT_STYLE_GUIDE,
      lastUpdated: null,
      isDirty: false,

      setContent: (content) => set({ 
        content, 
        isDirty: true 
      }),
      
      saveContent: (content) => set({ 
        content, 
        lastUpdated: new Date(),
        isDirty: false 
      }),
      
      resetToDefault: () => set({ 
        content: DEFAULT_STYLE_GUIDE,
        isDirty: true 
      }),
      
      markClean: () => set({ isDirty: false }),
    }),
    {
      name: 'style-guide-storage',
    }
  )
);
