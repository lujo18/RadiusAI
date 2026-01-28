"use client";

import { differenceInSeconds } from "date-fns";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTemplates, useBrands } from "@/lib/api/hooks";
import { useGenerationStore } from "@/store/generationStore";
import type { BrandSettings } from "@/components/TemplateCreator/contentTypes";
import type { Database } from "@/types/database";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PostContent } from "@/lib/parseJsonColumn.supabase";
import { contentApi } from "@/lib/api/client";
import { Post } from "@/types/types";
import { Workflow } from "@/components/workflows/common/Workflow";
import { PostItem } from "@/components/items/PostItem";

type Brand = Database["public"]["Tables"]["brand"]["Row"];

function getBrandSettings(brand: Brand): BrandSettings | null {
  if (!brand.brand_settings) return null;
  return brand.brand_settings as unknown as BrandSettings;
}

export default function GeneratePage() {
  const params = useParams();
  const brandId = params?.brandId as string;
``
  // Store
  const { queue, addToQueue, updateQueueItem } = useGenerationStore();

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<string>(brandId || "");

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(id);
  }, []);

  // Auto-set selectedProfile when brandId changes
  useEffect(() => {
    if (brandId) {
      setSelectedProfile(brandId);
    }
  }, [brandId]);

  // Generation states
  const [generatedPosts, setGeneratedPosts] = useState<Post[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const { data: templates, isLoading: templatesLoading } = useTemplates();
  const { data: brands, isLoading: brandsLoading } = useBrands();

  useEffect(() => {
    return () => {
      imageUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageUrls]);

  const handleGenerate = async () => {
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
        const rawTemplate = templates?.find((t) => t.id === selectedTemplate);
        const brand = brands?.find((b) => b.id === selectedProfile);

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


          const posts = await contentApi.generatePostsFromPrompt(
            template,
            brand.brand_settings as BrandSettings,
            selectedProfile,
            1,
          );

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
  };

  if (templatesLoading || brandsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <div className="">
        <div className="absolute p-4">
          <h1 className="text-3xl font-bold font-main mb-2">Generate Post</h1>
          <p className="text-muted-foreground mb-8">
            Select a template and press generate
          </p>
        </div>

        <Workflow
          brandId={brandId}
          selectedTemplateId={selectedTemplate}
          onTemplateSelect={setSelectedTemplate}
          handleGenerate={handleGenerate}
        />

        {/* <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Template Selection
            {selectedGenType === "template" ? (
              <div className="space-y-2">
                <Label htmlFor="template-select">Select Template</Label>
                <Select
                  value={selectedTemplate}
                  onValueChange={setSelectedTemplate}
                >
                  <SelectTrigger id="template-select">
                    <SelectValue placeholder="Choose a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates?.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTemplate && templates && (
                  <p className="text-sm text-muted-foreground">
                    Template:{" "}
                    {templates.find((t) => t.id === selectedTemplate)?.name}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <Label>Enter Generation Prompt</Label>
                <textarea
                  className="w-full h-[4rem]"
                  value={genertationPrompt}
                  onChange={(e) => setGenertationPrompt(e.target.value)}
                ></textarea>
              </div>
            )}

            

           
            {brands &&
              (() => {
                const brand = brands.find((b) => b.id === selectedProfile);
                const settings = brand ? getBrandSettings(brand) : null;
                return settings ? (
                  <div className="space-y-2 p-4 bg-foreground/5 rounded-lg border border-foreground/10">
                    <Label className="text-sm font-semibold">
                      Active Brand
                    </Label>
                    <p className="text-base font-medium">{settings.name}</p>
                    <p className="text-sm text-foreground/60">
                      Niche: {settings.niche}
                    </p>
                  </div>
                ) : null;
              })()}

            <div>
              <Select
                value={selectedGenType}
                onValueChange={setSelectedGenType}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={"Select generation type..."}
                  ></SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="template">Given Template</SelectItem>
                  <SelectItem value="prompt">Prompt Based</SelectItem>
                </SelectContent>
              </Select>
            </div>

            
            <Button
              onClick={handleGenerate}
              disabled={
                !selectedProfile ||
                (selectedGenType === "template" && !selectedTemplate) ||
                (selectedGenType === "prompt" && !genertationPrompt)
              }
              size="lg"
            >
              Generate Post
            </Button>
          </CardContent>
        </Card> */}

        <Card className="min-h-svh">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Generation Queue{" "}
              <span className="text-secondary">({queue.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {queue.map((request) => {
                let sec;

                if (request.status === "generating" || !request.completedAt) {
                  sec = differenceInSeconds(now, new Date(request.createdAt));
                } else {
                  sec = differenceInSeconds(
                    new Date(request.completedAt),
                    new Date(request.createdAt),
                  );
                }

                if (request.result && request.status === "completed") {
                  console.log("Post templates", request.result)

                  return (
                    
                    <PostItem postData={request.result[0]}/>
                  )
                }

                return (
                  
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background border border-foreground/10"
                  >
                    <div className="flex-1">
                      <div className="gap-4">
                        <p className="text-sm font-medium">
                          {request.templateId
                            ? "Template-based"
                            : "Prompt-based"}{" "}
                          generation
                        </p>
                        <span
                          className={`text-xs text-primary ${request.status === "generating" && "animate-pulse"}`}
                        >
                          {sec} seconds
                        </span>
                      </div>
                      <p className="text-xs text-foreground/60">
                        {request.templateId}
                        ...
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {request.status === "pending" && (
                        <span className="text-xs text-foreground/50">
                          Queued
                        </span>
                      )}
                      {request.status === "generating" && (
                        <span className="text-xs text-primary animate-pulse">
                          Generating...
                        </span>
                      )}
                      {request.status === "completed" && (
                        <span className="text-xs text-green-500">✓ Done</span>
                      )}
                      {request.status === "failed" && (
                        <span className="text-xs text-destructive">
                          ✗ Failed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        

        {/* Empty States */}
        {!templatesLoading && templates?.length === 0 && (
          <div className="mt-6 text-center text-muted-foreground text-sm">
            No templates found. Create a template first.
          </div>
        )}
        {!brandsLoading && brands?.length === 0 && (
          <div className="mt-6 text-center text-muted-foreground text-sm">
            No brands found. Create a brand first.
          </div>
        )}
      </div>
    </div>
  );
}
