import { Database } from "./database";

export type Post = Database["public"]["Tables"]["posts"]["Row"];

export type PostWithAnalytics = Post & {
  analytics?: {
    post_id: string;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    impressions: number;
    engagement_rate: number;
    last_updated: string;
  } | null;
};