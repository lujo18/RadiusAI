"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  Edit2, 
  Calendar,
  Eye,
  Heart,
  Share2,
  Bookmark,
  MessageCircle,
  TrendingUp,
  Download,
  ExternalLink,
  Image as ImageIcon
} from "lucide-react";
import Image from "next/image";

interface PostDetails {
  id: string;
  userId: string;
  templateId: string;
  platform: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  scheduledTime?: string;
  publishedTime?: string;
  content: {
    slides: Array<{
      slideNumber: number;
      text: string;
      imagePrompt: string;
    }>;
    caption: string;
    hashtags: string[];
  };
  storageUrls: {
    slides: string[];
    thumbnail: string | null;
  };
  analytics: {
    impressions: number;
    engagement: number;
    saves: number;
    shares: number;
    engagementRate: number;
    lastUpdated: string | null;
  };
  metadata: {
    variantLabel: string | null;
    generationParams: Record<string, any>;
  };
  template?: {
    id: string;
    name: string;
    category: string;
  };
  analyticsHistory?: Array<{
    date: string;
    metrics: {
      impressions: number;
      engagement: number;
      saves: number;
      shares: number;
    };
  }>;
}

async function fetchPostDetails(postId: string): Promise<PostDetails> {
  const token = localStorage.getItem("authToken");
  const response = await fetch(`http://localhost:8000/api/posts/${postId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch post details");
  }
  
  return response.json();
}

async function updatePostStatus(postId: string, status: string) {
  const token = localStorage.getItem("authToken");
  const response = await fetch(`http://localhost:8000/api/posts/${postId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  
  if (!response.ok) {
    throw new Error("Failed to update post");
  }
  
  return response.json();
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const postId = params.id as string;

  // Fetch post details
  const { data: post, isLoading, error } = useQuery({
    queryKey: ["post", postId],
    queryFn: () => fetchPostDetails(postId),
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => updatePostStatus(postId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading post details...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load post</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handlePublish = () => {
    if (window.confirm("Mark this post as published?")) {
      updateStatusMutation.mutate("published");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">Post Details</h1>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  post.status === 'published' ? 'bg-green-100 text-green-700' :
                  post.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                  post.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {post.status}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{post.platform === 'instagram' ? '📸 Instagram' : '🎵 TikTok'}</span>
                <span>•</span>
                <span>Created {new Date(post.createdAt).toLocaleDateString()}</span>
                {post.publishedTime && (
                  <>
                    <span>•</span>
                    <span>Published {new Date(post.publishedTime).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {post.status === 'draft' && (
                <button
                  onClick={handlePublish}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Mark as Published
                </button>
              )}
              {post.template && (
                <button
                  onClick={() => router.push(`/dashboard/template/${post.templateId}`)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Template
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Post Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Slides */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Slides</h2>
              
              <div className="grid grid-cols-2 gap-4">
                {post.storageUrls.slides.length > 0 ? (
                  post.storageUrls.slides.map((url, index) => (
                    <div key={index} className="relative aspect-[9/16] bg-gray-100 rounded-lg overflow-hidden group">
                      <img 
                        src={url} 
                        alt={`Slide ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                        <a 
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-0 group-hover:opacity-100 px-4 py-2 bg-white text-gray-900 rounded-lg flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                      </div>
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-75 text-white text-xs rounded">
                        Slide {index + 1}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 py-12 text-center">
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No slides uploaded yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Slide Content */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Slide Content</h2>
              
              <div className="space-y-4">
                {post.content.slides.map((slide, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                        Slide {slide.slideNumber}
                      </span>
                    </div>
                    <p className="text-gray-900 mb-2">{slide.text}</p>
                    <p className="text-sm text-gray-500 italic">
                      Image: {slide.imagePrompt}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Caption & Hashtags */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Caption & Hashtags</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Caption</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{post.content.caption}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hashtags</label>
                  <div className="flex flex-wrap gap-2">
                    {post.content.hashtags.map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Analytics & Info */}
          <div className="space-y-6">
            {/* Template Info */}
            {post.template && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Template</h2>
                <div className="space-y-2">
                  <p className="text-gray-900 font-medium">{post.template.name}</p>
                  <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                    {post.template.category}
                  </span>
                </div>
              </div>
            )}

            {/* Analytics */}
            {post.status === 'published' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Analytics</h2>
                  {post.analytics.lastUpdated && (
                    <span className="text-xs text-gray-500">
                      Updated {new Date(post.analytics.lastUpdated).toLocaleDateString()}
                    </span>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Eye className="w-5 h-5" />
                      <span className="text-sm">Impressions</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      {post.analytics.impressions.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Heart className="w-5 h-5" />
                      <span className="text-sm">Engagement</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      {post.analytics.engagement.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Bookmark className="w-5 h-5" />
                      <span className="text-sm">Saves</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      {post.analytics.saves.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Share2 className="w-5 h-5" />
                      <span className="text-sm">Shares</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      {post.analytics.shares.toLocaleString()}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600">
                        <TrendingUp className="w-5 h-5" />
                        <span className="text-sm font-medium">Engagement Rate</span>
                      </div>
                      <span className="text-2xl font-bold text-purple-600">
                        {post.analytics.engagementRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Post Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Post Information</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Post ID</span>
                  <span className="text-gray-900 font-mono text-xs">{post.id.slice(0, 8)}...</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform</span>
                  <span className="text-gray-900 font-medium">
                    {post.platform === 'instagram' ? 'Instagram' : 'TikTok'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="text-gray-900 font-medium capitalize">{post.status}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Slides</span>
                  <span className="text-gray-900 font-medium">{post.content.slides.length}</span>
                </div>

                {post.scheduledTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Scheduled</span>
                    <span className="text-gray-900 font-medium">
                      {new Date(post.scheduledTime).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
