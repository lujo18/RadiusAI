/**
 * Supabase Database Operations - Posts
 * 
 * Handles all post-related database operations.
 * Returns raw Supabase types (snake_case) for direct use.
 */

import { supabase } from '../client';
import type { 
  Post, 
  PostInsert, 
  PostUpdate,
  PostContent,
  Json 
} from '@/types';

// ==================== TYPE HELPERS ====================

/** Input for creating a new post */
export interface CreatePostInput {
  template_id: string;
  profile_id?: string;
  platform: string;
  content: PostContent;
  scheduled_time?: string;
  variant_set_id?: string;
}

/** Input for updating a post */
export interface UpdatePostInput {
  status?: string;
  scheduled_time?: string;
  content?: PostContent;
}

// ==================== CREATE ====================

export async function createPost(input: CreatePostInput): Promise<Post> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const insertData: PostInsert = {
    user_id: user.id,
    template_id: input.template_id,
    profile_id: input.profile_id || null,
    platform: input.platform,
    status: 'draft',
    content: input.content as unknown as Json,
    scheduled_time: input.scheduled_time || null,
    variant_set_id: input.variant_set_id || null,
    storage_urls: { slides: [], thumbnail: null } as unknown as Json,
    metadata: { variant_label: null, generation_params: {} } as unknown as Json,
  };

  const { data, error } = await supabase
    .from('posts')
    .insert(insertData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
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
  return data;
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

  return data;
}

export async function getPostsByStatus(status: string): Promise<Post[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
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
  return data;
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
  return data;
}

// ==================== UPDATE ====================

export async function updatePost(postId: string, updates: UpdatePostInput): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const updateData: PostUpdate = {};
  
  if (updates.status) updateData.status = updates.status;
  if (updates.scheduled_time) updateData.scheduled_time = updates.scheduled_time;
  if (updates.content) updateData.content = updates.content as unknown as Json;

  const { error } = await supabase
    .from('posts')
    .update(updateData)
    .eq('id', postId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

export async function updatePostStatus(postId: string, status: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const updateData: PostUpdate = { status };
  
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
      } as unknown as Json,
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

/**
 * Helper to safely extract content from a Post
 * Since content is stored as Json, use this to type-cast it
 */
export function getPostContent(post: Post): PostContent | null {
  return post.content as PostContent | null;
}

/**
 * Helper to safely extract storage URLs from a Post
 */
export function getStorageUrls(post: Post): { slides: string[]; thumbnail: string | null } {
  const urls = post.storage_urls as { slides?: string[]; thumbnail?: string | null } | null;
  return {
    slides: urls?.slides || [],
    thumbnail: urls?.thumbnail || null,
  };
}

/**
 * Helper to safely extract metadata from a Post
 */
export function getPostMetadata(post: Post): { variant_label: string | null; generation_params: Record<string, unknown> } {
  const metadata = post.metadata as { variant_label?: string | null; generation_params?: Record<string, unknown> } | null;
  return {
    variant_label: metadata?.variant_label || null,
    generation_params: metadata?.generation_params || {},
  };
}
