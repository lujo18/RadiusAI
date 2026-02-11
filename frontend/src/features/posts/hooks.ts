// React Query hooks for Posts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import postSurface from '@/features/posts/surface';
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
  return useQuery<Database['public']['Tables']['posts']['Row'][]>({
    queryKey: postKeys.filtered(filters || {}),
    queryFn: () => postSurface.getPosts(filters),
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
  return useQuery<Database['public']['Tables']['posts']['Row'] | null>({
    queryKey: postKeys.detail(postId),
    queryFn: () => postSurface.getPost(postId),
    enabled: !!postId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useScheduledPosts(fromDate?: Date, toDate?: Date, brandId?: string) {
  return useQuery<Database['public']['Tables']['posts']['Row'][]>({
    queryKey: fromDate && toDate ? [...postKeys.scheduled, fromDate.toISOString(), toDate.toISOString(), brandId] : [...postKeys.scheduled, brandId],
    queryFn: () => postSurface.getScheduledPosts(fromDate, toDate, brandId),
    staleTime: 5 * 60 * 1000, // 5 minutes - reduce API calls
    gcTime: 10 * 60 * 1000, // Keep cached for 10 minutes
    retry: 1, // Only retry once on failure
    retryDelay: 1000, // Wait 1 second before retry
  });
}

// ==================== MUTATIONS ====================

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postData: any) => postSurface.createPost(postData),
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
      postSurface.updatePost(postId, updates),
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
    mutationFn: (postId: string) => postSurface.deletePostWithSlides(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      queryClient.invalidateQueries({ queryKey: postKeys.scheduled });
    },
  });
}

export const usePublishPost = (brandId: string) => {
  const queryClient = useQueryClient();

  return useMutation<
    unknown,
    Error,
    { postId: string; platforms: string[] },
    { previous?: any[] }
  >({
    mutationFn: async ({ postId, platforms }) => {
      return await postSurface.publishPost({ brandId, platforms, postId });
    },
    onMutate: async ({ postId }) => {
      await queryClient.cancelQueries({ queryKey: postKeys.all });
      const previous = queryClient.getQueryData<any[]>(postKeys.all);
      queryClient.setQueryData<any[] | undefined>(postKeys.all, (old) => {
        const list = old ?? [];
        return list.map((p: any) => (p.id === postId ? { ...p, status: 'published' } : p));
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(postKeys.all, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      queryClient.invalidateQueries({ queryKey: postKeys.scheduled });
    },
  });
};

export const useDraftPost = (brandId: string) => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, { postId: string; platforms: string[] }, { previous?: any[] }>({
    mutationFn: ({ postId, platforms }) => postSurface.draftPost({ postId, platforms, brandId }),
    onMutate: async ({ postId }) => {
      await queryClient.cancelQueries({ queryKey: postKeys.all });
      const previous = queryClient.getQueryData<any[]>(postKeys.all);

      queryClient.setQueryData<any[] | undefined>(postKeys.all, (old) => {
        const list = old ?? [];
        return list.map((p: any) => (p.id === postId ? { ...p, status: 'draft' } : p));
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(postKeys.all, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      queryClient.invalidateQueries({ queryKey: postKeys.scheduled });
    },
  });
};

export const useSchedulePost = (brandId: string) => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, { postId: string; platforms: string[]; scheduledAt: Date }, { previous?: any[] }>({
    mutationFn: ({ postId, platforms, scheduledAt }) => 
      postSurface.schedulePost({ postId, platforms, scheduled_at: scheduledAt.toISOString(), brandId }),
    onMutate: async ({ postId }) => {
      await queryClient.cancelQueries({ queryKey: postKeys.all });
      const previous = queryClient.getQueryData<any[]>(postKeys.all);

      queryClient.setQueryData<any[] | undefined>(postKeys.all, (old) => {
        const list = old ?? [];
        return list.map((p: any) => (p.id === postId ? { ...p, status: 'scheduled' } : p));
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(postKeys.all, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      queryClient.invalidateQueries({ queryKey: postKeys.scheduled });
    },
  });
};
