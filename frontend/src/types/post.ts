// Post and Storage Types

export interface StorageUrls {
  slides: string[];
  thumbnail: string | null;
}

export interface PostAnalytics {
  impressions: number;
  engagement: number;
  saves: number;
  shares: number;
  engagementRate: number;
  lastUpdated: Date | null;
}

export interface PostMetadata {
  variantLabel: string | null;
  generationParams: Record<string, any>;
}

export interface Slide {
  slideNumber: number;
  text: string;
  imagePrompt: string;
}

export interface PostContent {
  slides: Slide[];
  caption: string;
  hashtags: string[];
}

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';
export type Platform = 'instagram' | 'tiktok';

export interface Post {
  id: string;
  userId: string;
  templateId: string;
  variantSetId?: string;
  platform: Platform;
  status: PostStatus;
  createdAt: Date;
  updatedAt?: Date;
  scheduledTime?: Date;
  publishedTime?: Date;
  content: PostContent;
  storageUrls: StorageUrls;
  analytics: PostAnalytics;
  metadata: PostMetadata;
}

export interface CreatePostRequest {
  templateId: string;
  platform: Platform;
  content: PostContent;
  scheduledTime?: Date;
  variantSetId?: string;
}

export interface UpdatePostRequest {
  status?: PostStatus;
  scheduledTime?: Date;
  content?: PostContent;
}

// Extended Post with template info
export interface PostWithTemplate extends Post {
  template?: {
    id: string;
    name: string;
    category: string;
  };
  analyticsHistory?: any[];
}
