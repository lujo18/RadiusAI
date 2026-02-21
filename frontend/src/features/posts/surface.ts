import { PostRepository } from "@/lib/supabase/repos/PostRepository";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import { postService } from "@/features/posts/services";

/**
 * Post CRUD operations only.
 * AI generation → use generation/hooks instead.
 */
export const postSurface = {
  async getPost(postId: string) {
    return await PostRepository.getPost(postId);
  },

  async getPosts(filters?: {
    status?: string;
    brandId?: string;
    templateId?: string;
    limit?: number;
  }) {
    const brandId = filters?.brandId;
    if (!brandId) throw new Error('brandId is required to fetch posts');
    
    return await PostRepository.getPosts(
      brandId,
      filters?.status as any,
      filters?.limit,
      filters?.templateId,
    );
  },

  async createPost(post: Database["public"]["Tables"]["posts"]["Insert"]) {
    return await PostRepository.createPost(post);
  },

  async updatePost(
    postId: string,
    updates: Partial<Database["public"]["Tables"]["posts"]["Update"]>,
  ) {
    return await PostRepository.updatePost(postId, updates);
  },

  async deletePost(postId: string) {
    return await PostRepository.deletePost(postId);
  },

  // Publishing operations
  async publishPost({
    brandId,
    platforms,
    postId,
  }: {
    brandId: string;
    platforms: string[];
    postId: string;
  }) {
    return await postService.publishPost(brandId, platforms, postId);
  },

  async draftPost({
    brandId,
    platforms,
    postId,
  }: {
    brandId: string;
    platforms: string[];
    postId: string;
  }) {
    return await postService.draftPost(brandId, platforms, postId);
  },

  async schedulePost({
    brandId,
    platforms,
    postId,
    scheduled_at,
  }: {
    brandId: string;
    platforms: string[];
    postId: string;
    scheduled_at: string;
  }) {
    return await postService.schedulePost(
      brandId,
      platforms,
      postId,
      scheduled_at,
    );
  },

  // Cleanup
  async deletePostWithSlides(postId: string) {
    return await postService.deletePostWithSlides(postId);
  },

  // Scheduled posts query
  async getScheduledPosts(fromDate?: Date, toDate?: Date, brandId?: string) {
    if (!brandId) throw new Error('brandId is required');
    
    let query = supabase
      .from("posts")
      .select("*")
      .eq("brand_id", brandId)
      .eq("status", "scheduled");

    if (fromDate) {
      query = query.gte("scheduled_time", fromDate.toISOString());
    }
    if (toDate) {
      query = query.lte("scheduled_time", toDate.toISOString());
    }

    query = query.order("scheduled_time", { ascending: true });

    const { data, error } = await query;

    console.log("[DEBUG] getScheduledPosts data:", data);

    if (error) throw new Error(error.message);
    return data;
  },

  async getPostsWithAnalyticsByBrand(brandId: string) {
    
    return PostRepository.getPostsWithAnalyticsByBrand(brandId);
  },

  async getPostWithAnalytics(postId: string) {
    return PostRepository.getPostWithAnalytics(postId);
  },
};

export default postSurface;
