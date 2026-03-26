"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTemplates } from "@/features/templates/hooks";
import { useBrands } from "@/features/brand/hooks";
import { useGenerationStore } from "@/store/generationStore";
import type { BrandSettings } from "@/components/TemplateCreator/contentTypes";
import type { Database } from "@/types/database";

import { PostContent } from "@/lib/parseJsonColumn.supabase";
import { Post } from "@/types/types";
import { useGeneratePostFromPrompt } from '@/features/generation/hooks';
import { Background, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { SettingsPanel } from "@/components/generation/SettingsPanel";
import { GenerationQueuePanel } from "@/components/generation/GenerationQueuePanel";

type Brand = Database["public"]["Tables"]["brand"]["Row"];

function getBrandSettings(brand: Brand): BrandSettings | null {
  if (!brand.brand_settings) return null;
  return brand.brand_settings as unknown as BrandSettings;
}

export default function GeneratePage() {
  const params = useParams();
  const brandId = params?.brandId as string;
  const { queue, addToQueue, updateQueueItem } = useGenerationStore();
  const generateMutation = useGeneratePostFromPrompt();

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedCta, setSelectedCta] = useState<string | null>(null);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<string>(brandId || "");

  // Auto-set selectedProfile when brandId changes
  useEffect(() => {
    if (brandId) {
      setSelectedProfile(brandId);
    }
  }, [brandId]);

  // Generation states
  const [generatedPosts, setGeneratedPosts] = useState<Post[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const { data: templates, isLoading: templatesLoading } = useTemplates(brandId);
  
  const { data: brands, isLoading: brandsLoading } = useBrands();

  useEffect(() => {
    return () => {
      imageUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageUrls]);

  const handleGenerate = useCallback(async () => {
    if (
     !selectedTemplate
    ) {
      alert("Please choose a template in required field");
      return;
    }

    // Add to queue and get request ID
    const requestId = addToQueue({
      templateId: selectedTemplate
    });

    // Update status to generating
    updateQueueItem(requestId, { status: "generating" });

    // Fire async request without blocking
    (async () => {
      try {
        const rawTemplate = (templates as any[])?.find((t: any) => t.id === selectedTemplate);
        const brand = (brands as any[])?.find((b: any) => b.id === selectedProfile);

        // if (brand && selectedGenType === "template" && rawTemplate) {
        //   // Patch template.brand_id to always be string|null
        //   const template = {
        //     ...rawTemplate,
        //     brand_id:
        //       typeof rawTemplate.brand_id === "undefined"
        //         ? null
        //         : rawTemplate.brand_id,
        //     tags:
        //       typeof rawTemplate.tags === "undefined" ? null : rawTemplate.tags,
        //     content_rules: {},
        //   };

        //   console.log("Generating with template");
        //   await createPostsFromTemplate(template, brand, 1);

        //   updateQueueItem(requestId, {
        //     status: "completed",
        //     result: [],
        //   });
        // } else if 
        
        if (brand && rawTemplate) {
          const template = {
            ...rawTemplate,
            brand_id:
              typeof rawTemplate.brand_id === "undefined"
                ? null
                : rawTemplate.brand_id,
            tags:
              typeof rawTemplate.tags === "undefined" ? null : rawTemplate.tags,
          };


          const posts = await generateMutation.mutateAsync({
            template,
            brandSettings: brand.brand_settings as BrandSettings,
            brandId: selectedProfile,
            ctaId: selectedCta || undefined,
            stock_pack_directory: selectedPackId || undefined,
            count: 1,
          });


          // Posts are already saved by the backend
          setGeneratedPosts((prev) => [...prev, ...posts]);

          updateQueueItem(requestId, {
            status: "completed",
            result: posts,
            completedAt: Date.now(),
          });
        } else {
          throw new Error("Invalid generation parameters");
        }
      } catch (error: any) {
        console.error("Failed to generate post:", error);

        // Handle specific error cases
        let errorMessage = "Failed to generate post. Please try again.";
        if (error.response?.status === 401) {
          errorMessage = "Your session has expired. Please sign in again.";
        } else if (error.code === "ERR_NETWORK") {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else {
          errorMessage =
            error.response?.data?.detail || error.message || errorMessage;
        }

        updateQueueItem(requestId, {
          status: "failed",
          error: errorMessage,
          completedAt: Date.now(),
        });
      }
    })();
  }, [selectedTemplate, selectedProfile, selectedCta, templates, brands, generateMutation, addToQueue, updateQueueItem, setGeneratedPosts]);

  if (templatesLoading || brandsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!templatesLoading && (templates as any[])?.length === 0) {
    return (
      <div className="mt-6 text-center text-muted-foreground text-sm">
        No templates found. Create a template first.
      </div>
    );
  }

  if (!brandsLoading && brands?.length === 0) {
    return (
      <div className="mt-6 text-center text-muted-foreground text-sm">
        No brands found. Create a brand first.
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* ReactFlow background layer */}
      <div className="absolute inset-0 z-0">
        <ReactFlow 
          defaultViewport={{ x: 0, y: 0, zoom: 0.95 }} 
          proOptions={{ hideAttribution: true }}
        >
          <Background />
        </ReactFlow>
      </div>

      {/* Main content overlay */}
      <div className="relative z-10 h-full w-full flex flex-col">
        {/* Header */}
        <div className="border-b border-border/50 px-6 py-4">
          <h1 className="text-3xl font-bold font-main">Generate Post</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure your settings on the left, monitor generation progress on the right</p>
        </div>

        {/* Two-column layout */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full grid grid-cols-1 md:grid-cols-[40%_60%] gap-4 p-6">
            {/* Left Column: Settings */}
            <div className="overflow-y-auto pr-2">
              <SettingsPanel
                brandId={brandId}
                selectedTemplateId={selectedTemplate}
                selectedCtaId={selectedCta}
                selectedPackId={selectedPackId}
                selectedProfile={selectedProfile}
                onTemplateSelect={setSelectedTemplate}
                onCtaSelect={setSelectedCta}
                onPackSelect={setSelectedPackId}
                onGenerateClick={handleGenerate}
                isGenerating={generateMutation.isPending}
              />
            </div>

            {/* Right Column: Output & History */}
            <div className="overflow-y-auto">
              <GenerationQueuePanel queue={queue} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
