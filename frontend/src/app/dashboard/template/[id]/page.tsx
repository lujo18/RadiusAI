
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
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
import { useTemplate, useUpdateTemplate, useDeleteTemplate } from "@/lib/api/hooks";
import type { Template } from "@/components/TemplateCreator/contentTypes";
import type { StyleConfig } from "@/components/TemplateCreator/styleConfigTypes";
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
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
import { useTemplate, useUpdateTemplate, useDeleteTemplate } from "@/lib/api/hooks";
import type { Template } from "@/components/TemplateCreator/contentTypes";
import type { StyleConfig } from "@/components/TemplateCreator/styleConfigTypes";

/** Helper to safely extract style config from template */
function getStyleConfig(template: Template): StyleConfig | null {
  if (!template.style_config) return null;
  return template.style_config as unknown as StyleConfig;
}

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  // Fetch template details
  const { data: template, isLoading, error } = useTemplate(templateId);

  // Update template name mutation
  const updateTemplateMutation = useUpdateTemplate();

  // Delete template mutation
  const deleteTemplateMutation = useDeleteTemplate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading template details...</p>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Failed to load template</p>
          <button
            onClick={() => router.push("/dashboard/templates")}
            className="px-4 py-2 bg-kinetic-mint hover:bg-kinetic-mint/80 text-obsidian rounded-lg transition"
          >
            Back to Templates
          </button>
        </div>
      </div>
    );
  }

  const handleSaveName = () => {
    if (newName.trim()) {
      updateTemplateMutation.mutate({ 
        templateId, 
        updates: { name: newName } 
      }, {
        onSuccess: () => {
          setIsEditingName(false);
        }
      });
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this template? This action cannot be undone.")) {
      deleteTemplateMutation.mutate(templateId, {
        onSuccess: () => {
          router.push("/dashboard/templates");
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <div className="bg-gray-900/50 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push("/dashboard/templates")}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition"
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
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-2xl font-bold flex-1 max-w-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={updateTemplateMutation.isPending}
                    className="px-4 py-2 bg-kinetic-mint hover:bg-kinetic-mint/80 text-obsidian rounded-lg transition disabled:opacity-50"
                  >
                    {updateTemplateMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-white">{template.name}</h1>
                  <button
                    onClick={() => {
                      setNewName(template.name);
                      setIsEditingName(true);
                    }}
                    className="p-2 text-gray-400 hover:text-white transition"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                </div>
              )}
              
              <div className="flex items-center gap-4 mt-2">
                <span className="px-3 py-1 bg-primary-500/10 text-primary-400 text-sm font-medium rounded-full border border-primary-500/20">
                  {template.category}
                </span>
                {template.is_default && (
                  <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 text-sm font-medium rounded-full border border-yellow-500/20 flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Default
                  </span>
                )}
                <span className="text-gray-500 text-sm">
                  Created {new Date(template.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/dashboard/template/${templateId}/edit`)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Template
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteTemplateMutation.isPending}
                className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {deleteTemplateMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Performance Stats - placeholder until performance is loaded separately */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary-500/10 rounded-lg">
                <ImageIcon className="w-5 h-5 text-primary-400" />
              </div>
              <div className="text-sm text-gray-400">Total Posts</div>
            </div>
            <div className="text-3xl font-bold text-white">0</div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Eye className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-sm text-gray-400">Avg Impressions</div>
            </div>
            <div className="text-3xl font-bold text-white">0</div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-pink-500/10 rounded-lg">
                <Heart className="w-5 h-5 text-pink-400" />
              </div>
              <div className="text-sm text-gray-400">Avg Engagement</div>
            </div>
            <div className="text-3xl font-bold text-white">0%</div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Bookmark className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-sm text-gray-400">Avg Saves</div>
            </div>
            <div className="text-3xl font-bold text-white">0</div>
          </div>
        </div>

        {/* Template Configuration */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Template Configuration</h2>
          
          {(() => {
            const styleConfig = getStyleConfig(template);
            if (!styleConfig) {
              return <p className="text-gray-400">No style configuration available</p>;
            }
            
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Layout</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Slide Count:</span>
                      <span className="text-white">{styleConfig.layout?.slide_count ?? 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Aspect Ratio:</span>
                      <span className="text-white">{styleConfig.layout?.aspect_ratio ?? 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        template.status === 'active' ? 'bg-green-500/10 text-green-400' :
                        template.status === 'testing' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-gray-500/10 text-gray-400'
                      }`}>
                        {template.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Content Rules</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Format:</span>
                      <span className="text-white">{styleConfig.content_rules?.format ?? 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Perspective:</span>
                      <span className="text-white">{styleConfig.content_rules?.perspective ?? 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Hook Style:</span>
                      <span className="text-white">{styleConfig.content_rules?.hook_style ?? 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Posts List Placeholder */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">Posts Using This Template</h2>
            <p className="text-sm text-gray-400 mt-1">
              View all posts created from this template
            </p>
          </div>

          <div className="p-12 text-center">
            <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-4">No posts created yet</p>
            <button
              onClick={() => router.push("/dashboard/generate")}
              className="px-4 py-2 bg-kinetic-mint hover:bg-kinetic-mint/80 text-obsidian rounded-lg transition"
            >
              Generate Your First Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
