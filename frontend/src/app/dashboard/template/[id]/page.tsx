"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  Edit2, 
  Trash2, 
  Star, 
  TrendingUp,
  Eye,
  Heart,
  Share2,
  Bookmark,
  Calendar,
  ImageIcon
} from "lucide-react";

interface TemplateDetails {
  template: {
    id: string;
    name: string;
    category: string;
    status: string;
    performance: {
      totalPosts: number;
      avgEngagementRate: number;
      avgSaves: number;
      avgImpressions: number;
    };
    styleConfig: any;
    createdAt: string;
  };
  posts: Array<{
    id: string;
    platform: string;
    status: string;
    createdAt: string;
    publishedTime?: string;
    analytics: {
      impressions: number;
      engagement: number;
      saves: number;
      shares: number;
      engagementRate: number;
    };
    storageUrls: {
      thumbnail: string | null;
    };
  }>;
  analytics: any[];
  summary: {
    totalPosts: number;
    avgEngagementRate: number;
    avgSaves: number;
    avgImpressions: number;
  };
}

async function fetchTemplateDetails(templateId: string): Promise<TemplateDetails> {
  const token = localStorage.getItem("authToken");
  const response = await fetch(`http://localhost:8000/api/templates/${templateId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch template details");
  }
  
  return response.json();
}

async function updateTemplateName(templateId: string, name: string) {
  const token = localStorage.getItem("authToken");
  const response = await fetch(`http://localhost:8000/api/templates/${templateId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });
  
  if (!response.ok) {
    throw new Error("Failed to update template");
  }
  
  return response.json();
}

async function deleteTemplate(templateId: string) {
  const token = localStorage.getItem("authToken");
  const response = await fetch(`http://localhost:8000/api/templates/${templateId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error("Failed to delete template");
  }
  
  return response.json();
}

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const templateId = params.id as string;
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  // Fetch template details
  const { data, isLoading, error } = useQuery({
    queryKey: ["template", templateId],
    queryFn: () => fetchTemplateDetails(templateId),
  });

  // Update template name mutation
  const updateNameMutation = useMutation({
    mutationFn: (name: string) => updateTemplateName(templateId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template", templateId] });
      setIsEditingName(false);
    },
  });

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteTemplate(templateId),
    onSuccess: () => {
      router.push("/dashboard?tab=templates");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading template details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load template</p>
          <button
            onClick={() => router.push("/dashboard?tab=templates")}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Back to Templates
          </button>
        </div>
      </div>
    );
  }

  const { template, posts, summary } = data;

  const handleSaveName = () => {
    if (newName.trim()) {
      updateNameMutation.mutate(newName);
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this template? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push("/dashboard?tab=templates")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Templates
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-2xl font-bold flex-1 max-w-md"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-gray-900">{template.name}</h1>
                  <button
                    onClick={() => {
                      setNewName(template.name);
                      setIsEditingName(true);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                </div>
              )}
              
              <div className="flex items-center gap-4 mt-2">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                  {template.category}
                </span>
                <span className="text-gray-500 text-sm">
                  Created {new Date(template.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/dashboard/template/${templateId}/edit`)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Style
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ImageIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-sm text-gray-600">Total Posts</div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{summary.totalPosts}</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-sm text-gray-600">Avg Impressions</div>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {summary.avgImpressions.toFixed(0)}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-pink-100 rounded-lg">
                <Heart className="w-5 h-5 text-pink-600" />
              </div>
              <div className="text-sm text-gray-600">Avg Engagement Rate</div>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {summary.avgEngagementRate.toFixed(1)}%
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Bookmark className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-sm text-gray-600">Avg Saves</div>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {summary.avgSaves.toFixed(0)}
            </div>
          </div>
        </div>

        {/* Posts List */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Posts Created from this Template</h2>
            <p className="text-sm text-gray-600 mt-1">
              All {posts.length} posts using this template
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {posts.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No posts created yet</p>
                <button
                  onClick={() => router.push("/dashboard?tab=create")}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Create Your First Post
                </button>
              </div>
            ) : (
              posts.map((post) => (
                <div
                  key={post.id}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/dashboard/post/${post.id}`)}
                >
                  <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                      {post.storageUrls.thumbnail ? (
                        <img 
                          src={post.storageUrls.thumbnail} 
                          alt="Post thumbnail"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Post Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          post.status === 'published' ? 'bg-green-100 text-green-700' :
                          post.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                          post.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {post.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {post.platform === 'instagram' ? '📸 Instagram' : '🎵 TikTok'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {post.publishedTime ? (
                          <>Published {new Date(post.publishedTime).toLocaleDateString()}</>
                        ) : (
                          <>Created {new Date(post.createdAt).toLocaleDateString()}</>
                        )}
                      </div>
                    </div>

                    {/* Analytics */}
                    {post.status === 'published' && (
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Eye className="w-4 h-4" />
                          {post.analytics.impressions}
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Heart className="w-4 h-4" />
                          {post.analytics.engagement}
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Bookmark className="w-4 h-4" />
                          {post.analytics.saves}
                        </div>
                        <div className="text-purple-600 font-medium">
                          {post.analytics.engagementRate.toFixed(1)}%
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
