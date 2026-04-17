import backendClient from '@/lib/api/clients/backendClient';
import { PostRepository } from '@/lib/supabase/repos/PostRepository';
import { StorageRepository } from '@/lib/supabase/repos/StorageRepository';

export const postService = {
  /**
   * Publish a post to one or more platforms
   */
  async publishPost(brand_id: string, platforms: string[], postId: string) {
    // Current backend route: POST /api/v1/posts/{post_id}/publish
    void brand_id;
    void platforms;
    const resp = await backendClient.post(`/api/v1/posts/${postId}/publish`);
    return resp.data;
  },

  /**
   * Save a post as draft without publishing
   */
  async draftPost(brand_id: string, platforms: string[], postId: string) {
    // Current backend route: PATCH /api/v1/posts/{post_id}
    void brand_id;
    void platforms;
    const resp = await backendClient.patch(`/api/v1/posts/${postId}`, {
      status: 'draft',
    });
    return resp.data;
  },

  /**
   * Schedule a post for future publication
   */
  async schedulePost(brand_id: string, platforms: string[], postId: string, scheduled_at: string) {
    // Current backend route: PATCH /api/v1/posts/{post_id}
    void brand_id;
    void platforms;
    const resp = await backendClient.patch(`/api/v1/posts/${postId}`, {
      status: 'scheduled',
      scheduled_time: scheduled_at,
    });
    return resp.data;
  },

  /**
   * Delete post and all associated slide images from storage
   */
  async deletePostWithSlides(postId: string) {
    await StorageRepository.deleteSlideImages(postId);
    return await PostRepository.deletePost(postId);
  },
};

export default postService;
