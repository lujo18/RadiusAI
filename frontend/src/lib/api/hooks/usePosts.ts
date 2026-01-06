// React Query hooks for Posts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postApi, contentApi } from '@/lib/api/client';

// Query Keys
export const postKeys = {
  all: ['posts'] as const,
  byBrand: (brandId: string | null) => ['posts', 'brand', brandId] as const,
  scheduled: ['posts', 'scheduled'] as const,
  detail: (id: string) => ['posts', id] as const,
  byStatus: (status: string) => ['posts', 'status', status] as const,
  withLimit: (limit: number) => ['posts', 'limit', limit] as const,
};

// ==================== QUERIES ====================

export function usePosts(status?: string, limit?: number, brandId?: string | null) {
  return useQuery({
    queryKey: [...postKeys.all, status, limit, brandId] as const,
    queryFn: () => postApi.getPosts(status, limit, brandId),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
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
    queryFn: contentApi.getScheduledPosts,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// ==================== MUTATIONS ====================

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postApi.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      queryClient.invalidateQueries({ queryKey: postKeys.scheduled });
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

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: contentApi.deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      queryClient.invalidateQueries({ queryKey: postKeys.scheduled });
    },
  });
}

export function usePublishPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postApi.publishPost,
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
