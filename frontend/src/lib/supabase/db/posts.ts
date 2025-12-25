/**
 * Supabase Database Operations - Posts
 * 
 * Handles all post-related database operations
 */

import { supabase } from '../client';
import type { Post, PostContent, PostStatus, Platform, CreatePostRequest, UpdatePostRequest } from '@/types/post';

// ==================== CREATE ====================

export async function createPost(request: CreatePostRequest): Promise<Post> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      template_id: request.templateId,
      platform: request.platform,
      status: 'draft',
      content: request.content as any,
      scheduled_time: request.scheduledTime?.toISOString(),
      variant_set_id: request.variantSetId,
      storage_urls: { slides: [], thumbnail: null },
      metadata: { variantLabel: null, generationParams: {} },
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return transformPost(data);
}

// ==================== READ ====================

export async function getUserPosts(): Promise<Post[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return data.map(transformPost);
}

export async function getPost(postId: string): Promise<Post | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }

  return transformPost(data);
}

export async function getPostsByStatus(status: PostStatus): Promise<Post[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return data.map(transformPost);
}

export async function getPostsByTemplate(templateId: string): Promise<Post[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', user.id)
    .eq('template_id', templateId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return data.map(transformPost);
}

export async function getScheduledPosts(): Promise<Post[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'scheduled')
    .order('scheduled_time', { ascending: true });

  if (error) throw new Error(error.message);

  return data.map(transformPost);
}

// ==================== UPDATE ====================

export async function updatePost(postId: string, updates: UpdatePostRequest): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const updateData: any = {};
  
  if (updates.status) updateData.status = updates.status;
  if (updates.scheduledTime) updateData.scheduled_time = updates.scheduledTime.toISOString();
  if (updates.content) updateData.content = updates.content;

  const { error } = await supabase
    .from('posts')
    .update(updateData)
    .eq('id', postId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

export async function updatePostStatus(postId: string, status: PostStatus): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const updateData: any = { status };
  
  if (status === 'published') {
    updateData.published_time = new Date().toISOString();
  }

  const { error } = await supabase
    .from('posts')
    .update(updateData)
    .eq('id', postId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

export async function updatePostStorageUrls(
  postId: string,
  slideUrls: string[],
  thumbnailUrl?: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('posts')
    .update({
      storage_urls: {
        slides: slideUrls,
        thumbnail: thumbnailUrl || null,
      },
    })
    .eq('id', postId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

// ==================== DELETE ====================

export async function deletePost(postId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

// ==================== HELPER FUNCTIONS ====================

function transformPost(data: any): Post {
  return {
    id: data.id,
    userId: data.user_id,
    templateId: data.template_id,
    variantSetId: data.variant_set_id,
    platform: data.platform,
    status: data.status,
    createdAt: new Date(data.created_at),
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
    scheduledTime: data.scheduled_time ? new Date(data.scheduled_time) : undefined,
    publishedTime: data.published_time ? new Date(data.published_time) : undefined,
    content: data.content as PostContent,
    storageUrls: data.storage_urls as any,
    analytics: {
      impressions: 0,
      engagement: 0,
      saves: 0,
      shares: 0,
      engagementRate: 0,
      lastUpdated: null,
    },
    metadata: data.metadata as any,
  };
}
