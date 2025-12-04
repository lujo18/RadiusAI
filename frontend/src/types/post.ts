// Post and Storage Types

import type { SlideDesign } from './slide';
import type { LayoutConfig } from './template';

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

/**
 * Slide in a post - derived from template's SlideDesign
 * with dynamic content filled in by AI
 */
export interface PostSlide extends Omit<SlideDesign, 'name'> {
  id: string;
  slideNumber: number;
  designId: string; // Reference to original SlideDesign.id from template
  imagePrompt?: string; // Optional AI-generated background prompt
}

export interface PostContent{
  slides: PostSlide[];
  layout: LayoutConfig;

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
