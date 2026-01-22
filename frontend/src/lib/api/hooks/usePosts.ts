// React Query hooks for Posts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postApi, contentApi } from '@/lib/api/client';
import { Database } from '@/types/database';

// Query Keys
export const postKeys = {
  all: ['posts'] as const,
  filtered: (filters: { status?: Database["public"]["Enums"]["post_status"]; brandId?: string; templateId?: string; limit?: number }) => 
    ['posts', filters] as const,
  byBrand: (brandId: string | null) => ['posts', 'brand', brandId] as const,
  byTemplate: (templateId: string) => ['posts', 'template', templateId] as const,
  scheduled: ['posts', 'scheduled'] as const,
  detail: (id: string) => ['posts', id] as const,
};

// ==================== QUERIES ====================

export function usePosts(filters?: {status?: Database["public"]["Enums"]["post_status"], limit?: number, brandId?: string, templateId?: string}) {
  return useQuery({
    queryKey: postKeys.filtered(filters || {}),
    queryFn: () => postApi.getPosts(filters),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Convenience hooks for specific use cases
export function usePostsByBrand(brandId: string) {
  return usePosts({ brandId });
}

export function usePostsByTemplate(templateId: string) {
  return usePosts({ templateId });
}

export function usePostsByStatus(status: Database["public"]["Enums"]["post_status"]) {
  return usePosts({ status });
}

export function usePost(postId: string) {
  return useQuery({
    queryKey: postKeys.detail(postId),
    queryFn: () => postApi.getPost(postId),
    enabled: !!postId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useScheduledPosts() {
  return useQuery({
    queryKey: postKeys.scheduled,
    queryFn: () => contentApi.getPosts({ status: 'scheduled' }),
    staleTime: 30 * 1000, // 30 seconds
  });
}

// ==================== MUTATIONS ====================

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postData: any) => postApi.createPost(postData),
    onSuccess: (_, postData) => {
      // Invalidate all generic queries
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      queryClient.invalidateQueries({ queryKey: postKeys.scheduled });

      // Invalidate brand-specific queries if brandId is provided
      if (postData?.brand_id) {
        queryClient.invalidateQueries({
          queryKey: postKeys.filtered({ brandId: postData.brand_id }),
        });
      }

      // Invalidate template-specific queries if templateId is provided
      if (postData?.template_id) {
        queryClient.invalidateQueries({
          queryKey: postKeys.filtered({ templateId: postData.template_id }),
        });
      }
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, updates }: { postId: string; updates: any }) =>
      postApi.updatePost({ postId, updates }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      queryClient.invalidateQueries({ queryKey: postKeys.detail(variables.postId) });
      queryClient.invalidateQueries({ queryKey: postKeys.scheduled });
    },
  });
}

export function useDeletePostWithSlides() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: contentApi.deletePostWithSlides,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      queryClient.invalidateQueries({ queryKey: postKeys.scheduled });
    },
  });
}

export function usePublishPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, lateAccountId }: { postId: string; lateAccountId: string }) =>
      postApi.publishPost(postId, lateAccountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      queryClient.invalidateQueries({ queryKey: postKeys.scheduled });
    },
  });
}

export function useGenerateWeek() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: contentApi.generateWeek,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.scheduled });
      queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });
}
