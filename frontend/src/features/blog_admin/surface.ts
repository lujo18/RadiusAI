import { blogAdminService } from "@/features/blog_admin/services";
import type {
  AdminBlogGeneratePayload,
  AdminBlogPublishPayload,
} from "@/features/blog_admin/types";

export const blogAdminApi = {
  listAdminPosts: async (limit?: number) => {
    return blogAdminService.listAdminPosts(limit);
  },
  generateDraft: async (payload: AdminBlogGeneratePayload) => {
    return blogAdminService.generateDraft(payload);
  },
  publishPost: async (payload: AdminBlogPublishPayload) => {
    return blogAdminService.publishPost(payload);
  },
};

export default blogAdminApi;
