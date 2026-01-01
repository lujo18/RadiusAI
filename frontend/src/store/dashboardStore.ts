
import type { Tables } from '@/types/database';

type DashboardPost = Tables<'posts'> & { scheduledTime?: Date; isSelected?: boolean };

interface DashboardStats {
  postsScheduled: number;
  totalEngagement: number;
  avgEngagementRate: number;
  topPerformer: string;
}

interface DashboardState {
  activeTab: 'overview' | 'calendar' | 'templates' | 'analytics' | 'style';
  isGenerating: boolean;
  scheduledPosts: DashboardPost[];
  stats: DashboardStats | null;
  // Actions
  setActiveTab: (tab: DashboardState['activeTab']) => void;
  setIsGenerating: (generating: boolean) => void;
  setScheduledPosts: (posts: DashboardPost[]) => void;
  setStats: (stats: DashboardStats) => void;
  addPost: (post: DashboardPost) => void;
  removePost: (postId: string) => void;
  updatePost: (postId: string, updates: Partial<DashboardPost>) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  activeTab: 'overview',
  isGenerating: false,
  scheduledPosts: [],
  stats: null,

  setActiveTab: (tab) => set({ activeTab: tab }),
  
  setIsGenerating: (generating) => set({ isGenerating: generating }),
  
  setScheduledPosts: (posts) => set({ scheduledPosts: posts }),
  
  setStats: (stats) => set({ stats }),
  
  addPost: (post) => set((state) => ({ 
    scheduledPosts: [...state.scheduledPosts, post] 
  })),
  
  removePost: (postId) => set((state) => ({ 
    scheduledPosts: state.scheduledPosts.filter(p => p.id !== postId) 
  })),
  
  updatePost: (postId, updates) => set((state) => ({
    scheduledPosts: state.scheduledPosts.map(p => 
      p.id === postId ? { ...p, ...updates } : p
    )
  })),
}));
import { create } from 'zustand';
