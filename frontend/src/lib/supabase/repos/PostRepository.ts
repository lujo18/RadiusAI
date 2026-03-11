import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { supabase } from '../client'
import { AnalyticsRepository } from '@/features/analytics/repo';

export class PostRepository {
  static async getPost(postId: string, userId?: string) {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data;
  }

  static async getPosts(brandId: string, status?: Database["public"]["Enums"]["post_status"], limit?: number, templateId?: string) {
    let query = supabase
      .from('posts')
      .select('*')
      .eq('brand_id', brandId);

    if (status) {
      query = query.eq('status', status);
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
    console.log("updated content", updates)
    const { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', postId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  static async updatePostStatus(postId: string, status: Database["public"]["Enums"]["post_status"]) {
    const updateData: any = { status };
    if (status === 'posted') {
      updateData.published_time = new Date().toISOString();
    }
    const { error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', postId);
    if (error) throw new Error(error.message);
    return true;
  }

  static async updatePostStorageUrls(postId: string, slideUrls: string[], thumbnailUrl?: string) {
    const { error } = await supabase
      .from('posts')
      .update({
        storage_urls: {
          slides: slideUrls,
          thumbnail: thumbnailUrl || null,
        },
      })
      .eq('id', postId);
    if (error) throw new Error(error.message);
    return true;
  }

  static async deletePost(postId: string) {
    const query = supabase
      .from('posts')
      .delete()
      .eq('id', postId);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return true;
  }

  /**
   * Return posts whose IDs are in the given list, with analytics attached.
   */
  static async getPostsByIds(postIds: string[]) {
    if (postIds.length === 0) return [];
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .in('id', postIds)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    const posts = data || [];
    // Fetch analytics for these specific posts
    const { data: analyticsData } = await supabase
      .from('post_analytics')
      .select('*')
      .in('post_id', postIds);
    const map = new Map<string, any>();
    (analyticsData || []).forEach((a: any) => map.set(a.post_id, a));
    return posts.map((p: any) => ({ ...p, analytics: map.get(p.id) ?? null }));
  }

  /**
   * Return all posts for a brand with their analytics attached on the `analytics` key.
   */
  static async getPostsWithAnalyticsByBrand(brandId: string) {
    const posts = await this.getPosts(brandId);

    if (!posts || posts.length === 0) return [];


    const analytics = await AnalyticsRepository.getAnalytics({ brandId });
    const map = new Map<string, any>();
    (analytics || []).forEach((a: any) => map.set(a.post_id, a));

    return posts.map((p: any) => ({ ...p, analytics: map.get(p.id) ?? null }));
  }

  /**
   * Return a single post with its analytics attached as `analytics`.
   */
  static async getPostWithAnalytics(postId: string) {
    const post = await this.getPost(postId);
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
