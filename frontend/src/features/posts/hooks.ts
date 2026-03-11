// React Query hooks for Posts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import postSurface from '@/features/posts/surface';
import { Database } from '@/types/database';

// Query Keys
export const postKeys = {
  all: () => ['posts'] as const,
  allForBrand: (brandId: string) => ['posts', brandId] as const,
  filtered: (brandId: string, filters: { status?: Database["public"]["Enums"]["post_status"]; templateId?: string; limit?: number }) => 
    ['posts', brandId, filters] as const,
  byTemplate: (brandId: string, templateId: string) => ['posts', brandId, 'template', templateId] as const,
  scheduled: (brandId: string) => ['posts', brandId, 'scheduled'] as const,
  detail: (brandId: string, id: string) => ['posts', brandId, id] as const,
};

// ==================== QUERIES ====================

export function usePosts(filters?: {status?: Database["public"]["Enums"]["post_status"], limit?: number, brandId?: string, templateId?: string}) {
  const brandId = filters?.brandId;

  return useQuery<Database['public']['Tables']['posts']['Row'][]>({
    queryKey: postKeys.filtered(brandId || '', filters || {}),
    queryFn: () => postSurface.getPosts({ ...filters }),
    enabled: !!brandId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Convenience hooks for specific use cases
export function usePostsByBrand(brandId: string) {
  return useQuery<Database['public']['Tables']['posts']['Row'][]>({
    queryKey: postKeys.allForBrand(brandId),
    queryFn: () => postSurface.getPosts({ brandId }),
    enabled: !!brandId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function usePostsByTemplate(templateId: string, brandId: string) {
  return useQuery<Database['public']['Tables']['posts']['Row'][]>({
    queryKey: postKeys.byTemplate(brandId, templateId),
    queryFn: () => postSurface.getPosts({ templateId, brandId }),
    enabled: !!brandId && !!templateId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function usePostsByStatus(status: Database["public"]["Enums"]["post_status"], brandId: string) {
  return useQuery<Database['public']['Tables']['posts']['Row'][]>({
    queryKey: postKeys.filtered(brandId, { status }),
    queryFn: () => postSurface.getPosts({ status, brandId }),
    enabled: !!brandId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function usePost(postId: string) {
  return useQuery<Database['public']['Tables']['posts']['Row'] | null>({
    queryKey: postKeys.detail('', postId),
    queryFn: () => postSurface.getPost(postId),
    enabled: !!postId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// ==================== POSTS + ANALYTICS ====================

export function usePostsByAutomation(automationId?: string | null, brandId?: string | null) {
  return useQuery({
    queryKey: ['posts', 'automation', automationId ?? null] as const,
    queryFn: async () => {
      if (!automationId || !brandId) return [];
      const res = await postSurface.getPostsByAutomation(automationId, brandId);
      return res ?? [];
    },
    enabled: !!automationId && !!brandId,
    staleTime: 2 * 60 * 1000,
  });
}

export function usePostsWithAnalytics(brandId?: string | null) {
  return useQuery({
    queryKey: ['postsWithAnalytics', 'brand', brandId ?? null] as const,
    queryFn: async () => {
      if (!brandId) return [];
      const res = await postSurface.getPostsWithAnalyticsByBrand(brandId);
      return res ?? [];
    },
    enabled: !!brandId,
    staleTime: 2 * 60 * 1000,
  });
}

export function usePostWithAnalytics(postId?: string | null) {
  return useQuery({
    queryKey: ['postsWithAnalytics', 'post', postId ?? null] as const,
    queryFn: async () => {
      if (!postId) return null;
      const res = await postSurface.getPostWithAnalytics(postId);
      return res ?? null;
    },
    enabled: !!postId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useScheduledPosts(brandId?: string, fromDate?: Date, toDate?: Date) {
  return useQuery<Database['public']['Tables']['posts']['Row'][]>({
    queryKey: [...postKeys.scheduled(brandId || ''), fromDate?.toISOString(), toDate?.toISOString()],
    queryFn: () => brandId ? postSurface.getPosts({ brandId, status: 'scheduled' as any }) : Promise.resolve([]),
    enabled: !!brandId,
    staleTime: 5 * 60 * 1000, // 5 minutes - reduce API calls
    gcTime: 10 * 60 * 1000, // Keep cached for 10 minutes
    retry: 1, // Only retry once on failure
    retryDelay: 1000, // Wait 1 second before retry
  });
}

// ==================== MUTATIONS ====================

export function useCreatePost(brandId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postData: any) => postSurface.createPost({ ...postData, brand_id: brandId }),
    onSuccess: (_, postData) => {
      // Invalidate brand-specific queries
      queryClient.invalidateQueries({ queryKey: postKeys.allForBrand(brandId) });
      queryClient.invalidateQueries({ queryKey: postKeys.scheduled(brandId) });

      // Invalidate template-specific queries if templateId is provided
      if (postData?.template_id) {
        queryClient.invalidateQueries({
          queryKey: postKeys.byTemplate(brandId, postData.template_id),
        });
      }
    },
  });
}

export function useUpdatePost(brandId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, updates }: { postId: string; updates: any }) =>
      postSurface.updatePost(postId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: postKeys.allForBrand(brandId) });
      queryClient.invalidateQueries({ queryKey: postKeys.detail(brandId, variables.postId) });
      queryClient.invalidateQueries({ queryKey: postKeys.scheduled(brandId) });
    },
  });
}

export function useDeletePostWithSlides(brandId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => postSurface.deletePostWithSlides(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.allForBrand(brandId) });
      queryClient.invalidateQueries({ queryKey: postKeys.scheduled(brandId) });
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
      await queryClient.cancelQueries({ queryKey: postKeys.allForBrand(brandId) });
      const previous = queryClient.getQueryData<any[]>(postKeys.allForBrand(brandId));
      queryClient.setQueryData<any[] | undefined>(postKeys.allForBrand(brandId), (old) => {
        const list = old ?? [];
        return list.map((p: any) => (p.id === postId ? { ...p, status: 'posted' } : p));
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(postKeys.allForBrand(brandId), context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.allForBrand(brandId) });
      queryClient.invalidateQueries({ queryKey: postKeys.scheduled(brandId) });
    },
  });
};

export const useDraftPost = (brandId: string) => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, { postId: string; platforms: string[] }, { previous?: any[] }>({
    mutationFn: ({ postId, platforms }) => postSurface.draftPost({ postId, platforms, brandId }),
    onMutate: async ({ postId }) => {
      await queryClient.cancelQueries({ queryKey: postKeys.allForBrand(brandId) });
      const previous = queryClient.getQueryData<any[]>(postKeys.allForBrand(brandId));

      queryClient.setQueryData<any[] | undefined>(postKeys.allForBrand(brandId), (old) => {
        const list = old ?? [];
        return list.map((p: any) => (p.id === postId ? { ...p, status: 'draft' } : p));
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(postKeys.allForBrand(brandId), context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.allForBrand(brandId) });
      queryClient.invalidateQueries({ queryKey: postKeys.scheduled(brandId) });
    },
  });
};

export const useSchedulePost = (brandId: string) => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, { postId: string; platforms: string[]; scheduledAt: Date }, { previous?: any[] }>({
    mutationFn: ({ postId, platforms, scheduledAt }) => 
      postSurface.schedulePost({ postId, platforms, scheduled_at: scheduledAt.toISOString(), brandId }),
    onMutate: async ({ postId }) => {
      await queryClient.cancelQueries({ queryKey: postKeys.allForBrand(brandId) });
      const previous = queryClient.getQueryData<any[]>(postKeys.allForBrand(brandId));

      queryClient.setQueryData<any[] | undefined>(postKeys.allForBrand(brandId), (old) => {
        const list = old ?? [];
        return list.map((p: any) => (p.id === postId ? { ...p, status: 'scheduled' } : p));
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(postKeys.allForBrand(brandId), context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.allForBrand(brandId) });
      queryClient.invalidateQueries({ queryKey: postKeys.scheduled(brandId) });
    },
  });
};
