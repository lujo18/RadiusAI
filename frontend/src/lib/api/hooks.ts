import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentApi, analyticsApi, styleGuideApi, userApi, templateApi, postApi } from '@/lib/api/client';

// ============================================
// QUERY KEYS - Centralized for easy invalidation
// ============================================

export const queryKeys = {
  // Posts
  posts: ['posts'] as const,
  scheduledPosts: ['posts', 'scheduled'] as const,
  post: (id: string) => ['posts', id] as const,
  
  // Analytics
  analytics: (timeframe: string) => ['analytics', timeframe] as const,
  variantPerformance: ['analytics', 'variants'] as const,
  
  // Templates
  templates: ['templates'] as const,
  template: (id: string) => ['templates', id] as const,
  
  // Style Guide
  styleGuide: ['styleGuide'] as const,
  
  // User
  profile: ['user', 'profile'] as const,
  accounts: ['user', 'accounts'] as const,
};

// ============================================
// CONTENT / POSTS HOOKS
// ============================================

// Fetch scheduled posts
export function useScheduledPosts() {
  return useQuery({
    queryKey: queryKeys.scheduledPosts,
    queryFn: contentApi.getScheduledPosts,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Generate week's content
export function useGenerateWeek() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: contentApi.generateWeek,
    onSuccess: () => {
      // Invalidate posts to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduledPosts });
    },
  });
}

// Delete post
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: contentApi.deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduledPosts });
    },
  });
}

// Update post
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: contentApi.updatePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduledPosts });
    },
  });
}

// ============================================
// ANALYTICS HOOKS
// ============================================

// Fetch analytics
export function useAnalytics(timeframe: 'day' | 'week' | 'month' = 'week') {
  return useQuery({
    queryKey: queryKeys.analytics(timeframe),
    queryFn: () => analyticsApi.getAnalytics(timeframe),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
}

// Fetch variant performance
export function useVariantPerformance() {
  return useQuery({
    queryKey: queryKeys.variantPerformance,
    queryFn: analyticsApi.getVariantPerformance,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Trigger AI analysis
export function useAnalyzeAndEvolve() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: analyticsApi.analyzeAndEvolve,
    onSuccess: () => {
      // Refresh analytics and style guide after analysis
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics('week') });
      queryClient.invalidateQueries({ queryKey: queryKeys.styleGuide });
    },
  });
}

// ============================================
// STYLE GUIDE HOOKS
// ============================================

// Fetch style guide
export function useStyleGuide() {
  return useQuery({
    queryKey: queryKeys.styleGuide,
    queryFn: styleGuideApi.getStyleGuide,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Update style guide
export function useUpdateStyleGuide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: styleGuideApi.updateStyleGuide,
    onSuccess: (data) => {
      // Update cache immediately
      queryClient.setQueryData(queryKeys.styleGuide, data);
    },
  });
}

// ============================================
// USER HOOKS
// ============================================

// Fetch user profile
export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: userApi.getProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Update user profile
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile, data);
    },
  });
}

// Fetch connected accounts
export function useConnectedAccounts() {
  return useQuery({
    queryKey: queryKeys.accounts,
    queryFn: userApi.getConnectedAccounts,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============================================
// TEMPLATE HOOKS
// ============================================

// Fetch user's templates
export function useTemplates() {
  return useQuery({
    queryKey: queryKeys.templates,
    queryFn: templateApi.getTemplates,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Fetch single template with details
export function useTemplate(templateId: string) {
  return useQuery({
    queryKey: queryKeys.template(templateId),
    queryFn: () => templateApi.getTemplate(templateId),
    enabled: !!templateId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Create new template
export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: templateApi.createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates });
    },
  });
}

// Update template
export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId, updates }: { templateId: string; updates: any }) => 
      templateApi.updateTemplate({ templateId, updates }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates });
      queryClient.invalidateQueries({ queryKey: queryKeys.template(variables.templateId) });
    },
  });
}

// Delete template
export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: templateApi.deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates });
    },
  });
}

// Set default template
export function useSetDefaultTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: templateApi.setDefaultTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates });
    },
  });
}

// ============================================
// POST HOOKS
// ============================================

// Fetch all posts
export function usePosts(status?: string, limit?: number) {
  return useQuery({
    queryKey: [...queryKeys.posts, status, limit] as const,
    queryFn: () => postApi.getPosts(status, limit),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Fetch single post
export function usePost(postId: string) {
  return useQuery({
    queryKey: queryKeys.post(postId),
    queryFn: () => postApi.getPost(postId),
    enabled: !!postId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Create post
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postApi.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts });
    },
  });
}

// Update post
export function useUpdatePostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, updates }: { postId: string; updates: any }) =>
      postApi.updatePost({ postId, updates }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts });
      queryClient.invalidateQueries({ queryKey: queryKeys.post(variables.postId) });
    },
  });
}

// Publish post
export function usePublishPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postApi.publishPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts });
    },
  });
}
