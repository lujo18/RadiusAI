import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { blogAdminApi } from "@/features/blog_admin/surface";
import type {
  AdminBlogGeneratePayload,
  AdminBlogPublishPayload,
} from "@/features/blog_admin/types";

export const blogAdminKeys = {
  all: ["admin-blog"] as const,
  posts: (limit: number) => ["admin-blog", "posts", limit] as const,
};

export function useAdminBlogPosts(limit: number = 200) {
  return useQuery({
    queryKey: blogAdminKeys.posts(limit),
    queryFn: () => blogAdminApi.listAdminPosts(limit),
  });
}

export function useGenerateAdminBlogDraft() {
  return useMutation({
    mutationFn: (payload: AdminBlogGeneratePayload) => blogAdminApi.generateDraft(payload),
  });
}

export function usePublishAdminBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdminBlogPublishPayload) => blogAdminApi.publishPost(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogAdminKeys.all });
    },
  });
}
