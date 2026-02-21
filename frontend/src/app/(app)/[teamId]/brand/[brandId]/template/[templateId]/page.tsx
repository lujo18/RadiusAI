"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from '@/components/ui/button';
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
import { useTemplate, useUpdateTemplate, useDeleteTemplate } from "@/features/templates/hooks";
import type { Template } from "@/components/TemplateCreator/contentTypes";
import type { StyleConfig } from "@/components/TemplateCreator/styleConfigTypes";

/** Helper to safely extract style config from template */
function getStyleConfig(template: Template): StyleConfig | null {
  if (!template.style_config) return null;
  return template.style_config as unknown as StyleConfig;
}

export default function TemplateDetailPage() {
        // Helper to check if styleConfig is the expected object
        function isStyleConfigObject(config: any): config is { content_rules?: any } {
          return config !== null && typeof config === 'object' && 'content_rules' in config;
        }
      // ...existing code...
    const handleDelete = () => {
      if (templateId) {
        (deleteTemplateMutation as any).mutate(templateId);
      }
    }
  const params = useParams();
  const router = useRouter();
  const templateId = params.templateId as string;
  const brandId = params.brandId as string;
  const teamId = params.teamId as string;
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  // Fetch template details
  const { data: template, isLoading, error } = useTemplate(templateId);

  // Always sanitize template before usage
  const sanitizedTemplate = template
    ? (() => {
        const t = template as any;
        return {
          ...t,
          brand_id: typeof t.brand_id === 'undefined' ? null : t.brand_id,
          tags: typeof t.tags === 'undefined' ? null : t.tags,
          content_rules: {},
        };
      })()
    : undefined;

  // Update template name mutation
  const updateTemplateMutation = useUpdateTemplate();

  // Delete template mutation
  const deleteTemplateMutation = useDeleteTemplate();
  // Compute styleConfig from sanitizedTemplate
  const styleConfig = sanitizedTemplate ? getStyleConfig(sanitizedTemplate) : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/90 via-muted/80 to-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted">Loading template details...</p>
        </div>
      </div>
    );
  }
  if (error || !template) {
  }

  if (error || !template) {

    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/90 via-muted/80 to-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <p className="text-danger mb-4">Failed to load template</p>
          <Button
            onClick={() => router.push(`/${teamId}/brand/templates`)}
          >
            Back to Templates
          </Button>
        </div>
      </div>
    );
  }
  // ...existing code...
  // Main return block
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Template Name and Actions */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground">{sanitizedTemplate?.name}</h1>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => router.push(`/${teamId}/brand/${params.brandId}/template/${templateId}/edit`)}
            className="px-4 py-2 bg-muted/90 border border-muted/80 text-foreground rounded-lg hover:bg-muted/70 transition flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Edit Template
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleteTemplateMutation.isPending}
            className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition flex items-center gap-2 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {deleteTemplateMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Total Posts */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary-500/10 rounded-lg">
              <ImageIcon className="w-5 h-5 text-primary-400" />
            </div>
            <div className="text-sm text-gray-400">Total Posts</div>
          </div>
          <div className="text-3xl font-bold text-white">0</div>
        </div>
        {/* Avg Impressions */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Eye className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-sm text-gray-400">Avg Impressions</div>
          </div>
          <div className="text-3xl font-bold text-white">0</div>
        </div>
        {/* Avg Engagement */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-pink-500/10 rounded-lg">
              <Heart className="w-5 h-5 text-pink-400" />
            </div>
            <div className="text-sm text-gray-400">Avg Engagement</div>
          </div>
          <div className="text-3xl font-bold text-white">0%</div>
        </div>
        {/* Avg Saves */}
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
        {isStyleConfigObject(styleConfig) && typeof styleConfig !== 'string' ? (() => {
          const configObj = styleConfig as Record<string, any>;
          const rules = configObj.content_rules || {};
          return (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Format:</span>
                <span className="text-white">{rules.format ?? 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Perspective:</span>
                <span className="text-white">{rules.perspective ?? 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Hook Style:</span>
                <span className="text-white">{rules.hook_style ?? 'N/A'}</span>
              </div>
            </div>
          );
        })() : (
          <p className="text-gray-400">No style configuration available</p>
        )}
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
          <Button
            onClick={() => router.push(`/${teamId}/brand/${params.brandId}/generate`)}
          >
            Generate Your First Post
          </Button>
        </div>
      </div>
    </div>
  );
}