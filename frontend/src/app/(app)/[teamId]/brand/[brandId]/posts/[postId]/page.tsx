"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { usePost, useUpdatePost } from '@/features/posts/hooks';
import { ArrowLeft } from "lucide-react";
import { Database } from "@/types/database";
import { usePostingModal } from '@/components/modals/PostingModalProvider';
import { useBrandIntegrations } from '@/features/brand/hooks';
import { useAnalytics } from "@/features/analytics";

type PostRow = Database['public']['Tables']['posts']['Row'];

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;
  const brandId = params.brandId as string;
  const teamId = params.teamId as string;

  // Fetch post details using hook
  const { data: post, isLoading, error } = usePost(postId);

  const { data: analytics, isLoading: analyticsLoading, error: analyticsError} = useAnalytics("24h", "first", null, postId);

  // Update post mutation using hook
  const updatePostMutation = useUpdatePost(brandId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading post details...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load post</p>
          <button
            onClick={() => router.push(`/${teamId}/brand/${brandId}/posts`)}
            className="px-4 py-2 bg-primary text-background rounded-lg hover:bg-primary/80"
          >
            Back to Posts
          </button>
        </div>
      </div>
    );
  }

  const handlePublish = () => {
    if (window.confirm("Mark this post as posted?")) {
      updatePostMutation.mutate({
        postId,
        updates: { status: "posted" }
      });
    }
  };

  // Parse JSON content
  const content = typeof post.content === 'string' ? JSON.parse(post.content) : post.content;
  const storageUrls = typeof post.storage_urls === 'string' ? JSON.parse(post.storage_urls) : post.storage_urls;

  // Local Post button component (uses global PostingModal)
  const PostButton = ({ post, brandId }: { post: any; brandId: string }) => {
    const postingModal = usePostingModal();
    const { data: integrations } = useBrandIntegrations(brandId);

    return (
      <button
        onClick={() => postingModal.open({ postData: post, brandId, integrations })}
        className="px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80"
      >
        Post
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-foreground/60 hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">Post Details</h1>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  post.status === 'posted' ? 'bg-green-100 text-green-700' :
                  post.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                  post.status === 'draft' ? 'bg-secondary text-foreground' :
                  'bg-red-100 text-red-700'
                }`}>
                  {post.status}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-foreground/60">
                <span>{post.platform === 'instagram' ? '📸 Instagram' : '🎵 TikTok'}</span>
                <span>•</span>
                <span>Created {new Date(post.created_at).toLocaleDateString()}</span>
                {post.published_time && (
                  <>
                    <span>•</span>
                    <span>Posted {new Date(post.published_time).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {post.status === 'draft' && (
                <button
                  onClick={handlePublish}
                  disabled={updatePostMutation.isPending}
                  className="px-4 py-2 bg-primary text-background rounded-lg hover:bg-primary/80 disabled:opacity-50"
                >
                  {updatePostMutation.isPending ? 'Updating...' : 'Mark as Posted'}
                </button>
              )}
              <PostButton post={post} brandId={brandId} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Post Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Slides */}
            {storageUrls?.slides && storageUrls.slides.length > 0 && (
              <div className="bg-card rounded-xl border border-border p-6 glass-card">
                <h2 className="text-xl font-bold text-foreground mb-4">Slides</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  {storageUrls.slides.map((url: string, index: number) => (
                    <div key={index} className="relative aspect-[9/16] bg-secondary rounded-lg overflow-hidden group">
                      <img 
                        src={url} 
                        alt={`Slide ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-75 text-white text-xs rounded">
                        Slide {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Caption & Content */}
            <div className="bg-card rounded-xl border border-border p-6 glass-card">
              <h2 className="text-xl font-bold text-foreground mb-4">Content</h2>
              
              <div className="space-y-4">
                {content.caption && (
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-2">Caption</label>
                    <p className="text-foreground whitespace-pre-wrap">{content.caption}</p>
                  </div>
                )}
                
                {content.hashtags && content.hashtags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-2">Hashtags</label>
                    <div className="flex flex-wrap gap-2">
                      {content.hashtags.map((tag: string, index: number) => (
                        <span key={index} className="px-3 py-1 bg-primary/20 text-primary text-sm rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Info */}
          <div className="space-y-6">
            {/* Post Info */}
            <div className="bg-card rounded-xl border border-border p-6 glass-card">
              <h2 className="text-lg font-bold text-foreground mb-4">Post Information</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground/60">Post ID</span>
                  <span className="text-foreground font-mono text-xs">{post.id.slice(0, 8)}...</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-foreground/60">Platform</span>
                  <span className="text-foreground font-medium capitalize">
                    {post.platform === 'instagram' ? 'Instagram' : 'TikTok'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-foreground/60">Status</span>
                  <span className="text-foreground font-medium capitalize">{post.status}</span>
                </div>

                {post.scheduled_time && (
                  <div className="flex justify-between">
                    <span className="text-foreground/60">Scheduled</span>
                    <span className="text-foreground font-medium">
                      {new Date(post.scheduled_time).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <p>{
          analyticsLoading ?
          ("Loading analytics"):
          (JSON.stringify(analytics))
          
          }</p>
      </div>
    </div>
  );
}
