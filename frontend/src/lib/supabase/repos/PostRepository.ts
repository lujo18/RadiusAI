import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { supabase } from '../client'
import { AnalyticsRepository } from '@/features/analytics/repo';

export class PostRepository {
  static async getPost(postId: string, userId?: string) {
    let query = supabase
      .from('posts')
      .select('*')
      .eq('id', postId);
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query.single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data;
  }

  static async getPosts(userId: string, status?: Database["public"]["Enums"]["post_status"], limit?: number, brandId?: string, templateId?: string) {
    let query = supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)

      if (status) {
        query = query.eq('status', status);
      }
      if (brandId) {
        query = query.eq('brand_id', brandId);
      }
      if (templateId) {
        query = query.eq('template_id', templateId);
      }

      query = query.order('created_at', { ascending: false });
      if (limit) {
        query = query.limit(limit);
      }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  }

  static async createPost(post: Database['public']['Tables']['posts']['Insert']) {
    // Ensure required fields are present
    if (!post.user_id) throw new Error('user_id is required to create a post');
    if (!post.brand_id) throw new Error('brand_id is required to create a post');
    
    const { data, error } = await supabase
      .from('posts')
      .insert([post])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  static async updatePost(postId: string, updates: Partial<Database['public']['Tables']['posts']['Update']>, userId?: string) {
    let query = supabase
      .from('posts')
      .update(updates)
      .eq('id', postId);
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query.select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  static async updatePostStatus(postId: string, status: Database["public"]["Enums"]["post_status"], userId: string) {
    const updateData: any = { status };
    if (status === 'posted') {
      updateData.published_time = new Date().toISOString();
    }
    const { error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', postId)
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    return true;
  }

  static async updatePostStorageUrls(postId: string, userId: string, slideUrls: string[], thumbnailUrl?: string) {
    const { error } = await supabase
      .from('posts')
      .update({
        storage_urls: {
          slides: slideUrls,
          thumbnail: thumbnailUrl || null,
        },
      })
      .eq('id', postId)
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    return true;
  }

  static async deletePost(postId: string, userId?: string) {
    let query = supabase
      .from('posts')
      .delete()
      .eq('id', postId);
    if (userId) query = query.eq('user_id', userId);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return true;
  }

  /**
   * Return all posts for a brand with their analytics attached on the `analytics` key.
   */
  static async getPostsWithAnalyticsByBrand(brandId: string, userId: string) {
    const posts = await this.getPosts(userId, undefined, undefined, brandId);
    if (!posts || posts.length === 0) return [];

    const analytics = await AnalyticsRepository.getAnalytics({ brandId });
    const map = new Map<string, any>();
    (analytics || []).forEach((a: any) => map.set(a.post_id, a));

    return posts.map((p: any) => ({ ...p, analytics: map.get(p.id) ?? null }));
  }

  /**
   * Return a single post with its analytics attached as `analytics`.
   */
  static async getPostWithAnalytics(postId: string, userId?: string) {
    const post = await this.getPost(postId, userId);
    if (!post) return null;
    const analytics = await AnalyticsRepository.getPostAnalytics(postId);
    return { ...post, analytics: analytics ?? null };
  }

  // Helpers
  static getPostContent(post: any) {
    return post.content as any || null;
  }
  static getStorageUrls(post: any) {
    const urls = post.storage_urls as { slides?: string[]; thumbnail?: string | null } | null;
    return {
      slides: urls?.slides || [],
      thumbnail: urls?.thumbnail || null,
    };
  }
  static getPostMetadata(post: any) {
    const metadata = post.metadata as { variant_label?: string | null; generation_params?: Record<string, unknown> } | null;
    return {
      variant_label: metadata?.variant_label || null,
      generation_params: metadata?.generation_params || {},
    };
  }
}
