import { create } from 'zustand';

interface PerformanceData {
  day: string;
  impressions: number;
  engagement: number;
  saves: number;
}

interface VariantPerformance {
  variant: string;
  posts: number;
  avgSaves: number;
  avgShares: number;
}

interface AnalyticsState {
  performanceData: PerformanceData[];
  variantPerformance: VariantPerformance[];
  timeframe: 'day' | 'week' | 'month';
  isLoading: boolean;
  lastFetched: Date | null;
  
  // Actions
  setPerformanceData: (data: PerformanceData[]) => void;
  setVariantPerformance: (data: VariantPerformance[]) => void;
  setTimeframe: (timeframe: AnalyticsState['timeframe']) => void;
  setLoading: (loading: boolean) => void;
  setLastFetched: () => void;
  clearAnalytics: () => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  performanceData: [],
  variantPerformance: [],
  timeframe: 'week',
  isLoading: false,
  lastFetched: null,

  setPerformanceData: (data) => set({ performanceData: data }),
  
  setVariantPerformance: (data) => set({ variantPerformance: data }),
  
  setTimeframe: (timeframe) => set({ timeframe }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setLastFetched: () => set({ lastFetched: new Date() }),
  
  clearAnalytics: () => set({ 
    performanceData: [], 
    variantPerformance: [],
    lastFetched: null 
  }),
}));
