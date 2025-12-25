export interface User {
  id: string;
  name: string;
  email: string;
  plan: 'starter' | 'growth' | 'unlimited';
}

export interface Post {
  id: string;
  platform: 'Instagram' | 'TikTok';
  title: string;
  caption: string;
  hashtags: string[];
  scheduledTime: Date;
  status: 'scheduled' | 'published' | 'failed';
  variantId: string;
  slides: Slide[];
}

export interface Slide {
  slideNumber: number;
  slideText: string;
  imageUrl: string;
  imageSearchTerm: string;
}

export interface StyleGuide {
  id: string;
  userId: string;
  content: string;
  updatedAt: Date;
}

export interface Analytics {
  postId: string;
  impressions: number;
  engagement: number;
  saves: number;
  shares: number;
  reach: number;
  profileVisits: number;
  date: Date;
}

export interface VariantPerformance {
  variantId: string;
  name: string;
  postsCount: number;
  avgSaves: number;
  avgShares: number;
  avgEngagementRate: number;
}

export interface DashboardStats {
  postsScheduled: number;
  totalEngagement: number;
  avgEngagementRate: number;
  topPerformer: string;
}
