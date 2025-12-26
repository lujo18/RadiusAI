/**
 * Supabase Database Operations - Analytics
 * 
 * Handles all analytics-related database operations.
 * Returns raw Supabase types (snake_case) for direct use.
 */

import { supabase } from '../client';
import type { PostAnalytics } from '@/types';

// ==================== CREATE/UPDATE ====================

export async function createPostAnalytics(postId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Verify user owns the post
  const { data: post } = await supabase
    .from('posts')
    .select('id')
    .eq('id', postId)
    .eq('user_id', user.id)
    .single();

  if (!post) throw new Error('Post not found');

  const { error } = await supabase
    .from('post_analytics')
    .insert({
      post_id: postId,
      impressions: 0,
      engagement: 0,
      saves: 0,
      shares: 0,
      engagement_rate: 0,
      last_updated: null,
    });

  if (error && error.code !== '23505') { // Ignore unique constraint violation
    throw new Error(error.message);
  }
}

export async function updatePostAnalytics(
  postId: string,
  analytics: Partial<PostAnalytics>
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Verify user owns the post
  const { data: post } = await supabase
    .from('posts')
    .select('id')
    .eq('id', postId)
    .eq('user_id', user.id)
    .single();

  if (!post) throw new Error('Post not found');

  const updateData: Partial<PostAnalytics> = {
    last_updated: new Date().toISOString(),
  };
  
  if (analytics.impressions !== undefined) updateData.impressions = analytics.impressions;
  if (analytics.engagement !== undefined) updateData.engagement = analytics.engagement;
  if (analytics.saves !== undefined) updateData.saves = analytics.saves;
  if (analytics.shares !== undefined) updateData.shares = analytics.shares;
  
  // Calculate engagement rate
  if (updateData.impressions && updateData.engagement) {
    updateData.engagement_rate = (updateData.engagement / updateData.impressions) * 100;
  }

  const { error } = await supabase
    .from('post_analytics')
    .update(updateData)
    .eq('post_id', postId);

  if (error) throw new Error(error.message);
}

// ==================== READ ====================

export async function getPostAnalytics(postId: string): Promise<PostAnalytics | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Verify user owns the post
  const { data: post } = await supabase
    .from('posts')
    .select('id')
    .eq('id', postId)
    .eq('user_id', user.id)
    .single();

  if (!post) return null;

  const { data, error } = await supabase
    .from('post_analytics')
    .select('*')
    .eq('post_id', postId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No analytics yet
      return null;
    }
    throw new Error(error.message);
  }

  return data;
}

export async function getAllUserAnalytics(): Promise<Array<{ post_id: string; analytics: PostAnalytics }>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Get all user's posts with analytics
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id,
      post_analytics (*)
    `)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);

  return data.map((item: any) => ({
    post_id: item.id,
    analytics: item.post_analytics || null,
  }));
}

export async function getTemplateAggregateAnalytics(templateId: string): Promise<{
  total_posts: number;
  avg_impressions: number;
  avg_engagement: number;
  avg_saves: number;
  avg_shares: number;
  avg_engagement_rate: number;
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Verify user owns the template
  const { data: template } = await supabase
    .from('templates')
    .select('id')
    .eq('id', templateId)
    .eq('user_id', user.id)
    .single();

  if (!template) throw new Error('Template not found');

  // Get all posts for this template with analytics
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id,
      post_analytics (
        impressions,
        engagement,
        saves,
        shares,
        engagement_rate
      )
    `)
    .eq('template_id', templateId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);

  // Calculate aggregates
  const postsWithAnalytics = data.filter((item: any) => item.post_analytics);
  const total = postsWithAnalytics.length;

  if (total === 0) {
    return {
      total_posts: 0,
      avg_impressions: 0,
      avg_engagement: 0,
      avg_saves: 0,
      avg_shares: 0,
      avg_engagement_rate: 0,
    };
  }

  const sums = postsWithAnalytics.reduce(
    (acc: any, item: any) => ({
      impressions: acc.impressions + (item.post_analytics?.impressions || 0),
      engagement: acc.engagement + (item.post_analytics?.engagement || 0),
      saves: acc.saves + (item.post_analytics?.saves || 0),
      shares: acc.shares + (item.post_analytics?.shares || 0),
      engagement_rate: acc.engagement_rate + (item.post_analytics?.engagement_rate || 0),
    }),
    { impressions: 0, engagement: 0, saves: 0, shares: 0, engagement_rate: 0 }
  );

  return {
    total_posts: total,
    avg_impressions: sums.impressions / total,
    avg_engagement: sums.engagement / total,
    avg_saves: sums.saves / total,
    avg_shares: sums.shares / total,
    avg_engagement_rate: sums.engagement_rate / total,
  };
}
