import backendClient from "@/lib/api/clients/backendClient";
import type {
  AdminBlogGeneratePayload,
  AdminBlogGenerateResponse,
  AdminBlogPublishPayload,
  BlogListResponse,
  BlogPost,
} from "@/features/blog_admin/types";

const blogAdminService = {
  async listAdminPosts(limit: number = 200): Promise<BlogListResponse> {
    const response = await backendClient.get<BlogListResponse>("/api/admin/blog/posts", {
      params: { limit },
    });
    return response.data;
  },

  async generateDraft(payload: AdminBlogGeneratePayload): Promise<AdminBlogGenerateResponse> {
    const response = await backendClient.post<AdminBlogGenerateResponse>(
      "/api/admin/blog/generate",
      payload
    );
    return response.data;
  },

  async publishPost(payload: AdminBlogPublishPayload): Promise<BlogPost> {
    const response = await backendClient.post<BlogPost>("/api/admin/blog/publish", payload);
    return response.data;
  },
};

export { blogAdminService };
export default blogAdminService;
