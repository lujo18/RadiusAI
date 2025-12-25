/**
 * Supabase Database Operations - Analytics
 * 
 * Handles all analytics-related database operations
 */

import { supabase } from '../client';
import type { PostAnalytics } from '@/types/post';

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

  const updateData: any = {
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
      // No analytics yet, return defaults
      return {
        impressions: 0,
        engagement: 0,
        saves: 0,
        shares: 0,
        engagementRate: 0,
        lastUpdated: null,
      };
    }
    throw new Error(error.message);
  }

  return {
    impressions: data.impressions,
    engagement: data.engagement,
    saves: data.saves,
    shares: data.shares,
    engagementRate: Number(data.engagement_rate),
    lastUpdated: data.last_updated ? new Date(data.last_updated) : null,
  };
}

export async function getAllUserAnalytics(): Promise<Array<{ postId: string; analytics: PostAnalytics }>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Get all user's posts with analytics
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id,
      post_analytics (
        impressions,
        engagement,
        saves,
        shares,
        engagement_rate,
        last_updated
      )
    `)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);

  return data.map((item: any) => ({
    postId: item.id,
    analytics: item.post_analytics ? {
      impressions: item.post_analytics.impressions,
      engagement: item.post_analytics.engagement,
      saves: item.post_analytics.saves,
      shares: item.post_analytics.shares,
      engagementRate: Number(item.post_analytics.engagement_rate),
      lastUpdated: item.post_analytics.last_updated ? new Date(item.post_analytics.last_updated) : null,
    } : {
      impressions: 0,
      engagement: 0,
      saves: 0,
      shares: 0,
      engagementRate: 0,
      lastUpdated: null,
    },
  }));
}

// ==================== AGGREGATE ANALYTICS ====================

export async function getTemplateAggregateAnalytics(templateId: string): Promise<{
  totalPosts: number;
  avgEngagement: number;
  avgImpressions: number;
  avgSaves: number;
  avgShares: number;
  totalEngagement: number;
  totalImpressions: number;
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Get all posts for this template
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('id')
    .eq('user_id', user.id)
    .eq('template_id', templateId);

  if (postsError) throw new Error(postsError.message);

  if (!posts || posts.length === 0) {
    return {
      totalPosts: 0,
      avgEngagement: 0,
      avgImpressions: 0,
      avgSaves: 0,
      avgShares: 0,
      totalEngagement: 0,
      totalImpressions: 0,
    };
  }

  const postIds = posts.map(p => p.id);

  // Get analytics for all posts
  const { data: analytics, error: analyticsError } = await supabase
    .from('post_analytics')
    .select('*')
    .in('post_id', postIds);

  if (analyticsError) throw new Error(analyticsError.message);

  if (!analytics || analytics.length === 0) {
    return {
      totalPosts: posts.length,
      avgEngagement: 0,
      avgImpressions: 0,
      avgSaves: 0,
      avgShares: 0,
      totalEngagement: 0,
      totalImpressions: 0,
    };
  }

  const totalEngagement = analytics.reduce((sum, a) => sum + a.engagement, 0);
  const totalImpressions = analytics.reduce((sum, a) => sum + a.impressions, 0);
  const totalSaves = analytics.reduce((sum, a) => sum + a.saves, 0);
  const totalShares = analytics.reduce((sum, a) => sum + a.shares, 0);

  return {
    totalPosts: posts.length,
    avgEngagement: totalEngagement / analytics.length,
    avgImpressions: totalImpressions / analytics.length,
    avgSaves: totalSaves / analytics.length,
    avgShares: totalShares / analytics.length,
    totalEngagement,
    totalImpressions,
  };
}
