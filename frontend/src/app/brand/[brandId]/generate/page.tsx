"use client";

import React, { useEffect, useState } from "react";
import { useTemplates, useBrands, useCreatePost } from "@/lib/api/hooks";
import type { BrandSettings } from "@/components/TemplateCreator/contentTypes";
import type { Database } from "@/types/database";
import {
  createPostsFromPrompt,
  createPostsFromTemplate,
} from "@/services/slideGenerator";
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

type Brand = Database["public"]["Tables"]["brand"]["Row"];

function getBrandSettings(brand: Brand): BrandSettings | null {
  if (!brand.brand_settings) return null;
  return brand.brand_settings as unknown as BrandSettings;
}

export default function GeneratePage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const [selectedGenType, setSelectedGenType] = useState<string>("");
  const [genertationPrompt, setGenertationPrompt] = useState<string>(
    "Create a '4 habits that put you in the 1%' slideshow"
  );

  // Generation states
  const [generating, setGenerating] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<Post[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const createPost = useCreatePost();
  const { data: templates, isLoading: templatesLoading } = useTemplates();
  const { data: brands, isLoading: brandsLoading } = useBrands();

  useEffect(() => {
    return () => {
      imageUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageUrls]);

  const handleGenerate = async () => {
    if (
      (selectedGenType === "template" && !selectedTemplate) ||
      (selectedGenType === "prompt" && !genertationPrompt) ||
      !selectedProfile
    ) {
      alert("Please select both a template and brand");
      return;
    }

    setGenerating(true);
    const rawTemplate = templates?.find((t) => t.id === selectedTemplate);
    const brand = brands?.find((b) => b.id === selectedProfile);
    const prompt = genertationPrompt;

    try {
      if (brand && selectedGenType === "template" && rawTemplate) {
        // Patch template.brand_id to always be string|null
        const template = {
          ...rawTemplate,
          brand_id:
            typeof rawTemplate.brand_id === "undefined"
              ? null
              : rawTemplate.brand_id,
          tags:
            typeof rawTemplate.tags === "undefined" ? null : rawTemplate.tags,
          content_rules: {},
        };

        console.log("Generating with template");
        // createPostsFromTemplate returns Blob[] - not what we need for display
        await createPostsFromTemplate(template, brand, 1);
        alert(
          "Post generated successfully! (Note: Template generation returns blobs, not posts)"
        );
      } else if (brand && selectedGenType === "prompt" && prompt) {
        console.log("Auto generating with prompt");
        const posts = await contentApi.generatePostsFromPrompt(
          prompt,
          brand.brand_settings as BrandSettings,
          1
        );

        console.log("Posts", posts);
        setGeneratedPosts(posts);
        alert("Post generated successfully!");
      } else {
        setGenerating(false);
        return;
      }

      setSelectedTemplate("");
      setSelectedProfile("");
    } catch (error: any) {
      console.error("Failed to generate post:", error);

      // Handle specific error cases
      if (error.response?.status === 401) {
        alert("Your session has expired. Please sign in again.");
        // Don't manually redirect - interceptor handles it
      } else if (error.code === "ERR_NETWORK") {
        alert("Network error. Please check your connection and try again.");
      } else {
        alert(
          error.response?.data?.detail ||
            "Failed to generate post. Please try again."
        );
      }
    }

    setGenerating(false);
  };

  if (templatesLoading || brandsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold font-main mb-2">Generate Post</h1>
        <p className="text-muted-foreground mb-8">
          Select a template and brand to generate a new post
        </p>
        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Template Selection */}
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

            {/* Presets for testing */}
            <div>
              <Button
                onClick={() =>
                  setGenertationPrompt(`Slideshow hook: "7 challenges that'll actually change you in 2026" (use this hook as is don't change it)
background_query: "sunrise mountain aura" (use this hook as is don't change it)

Slide show focus should be on self improvement and life improvement advice. Even though the brand is tech related, focus on specifically self improvement that will result in being well rounded (not just tech focused)`)
                }
              >
                Pinglo Preset
              </Button>
              <Button
                onClick={() =>
                  setGenertationPrompt(`Role: You are a Behavioral Psychologist and Communication Strategist specializing in minimalist, high-trust TikTok slideshows.

Objective: Convert viewers into followers and leads using the "Script & Secret" methodology: Provide a specific social script and explain the psychological "why" behind it.

Content Structure (7 Slides):

Slide 1 (The Hook): A polarizing or relatable social "gap"
Slide 2 (The Secret): 1-2 sentences on the underlying psychology (e.g., Status Signaling).
Slides 3-5 (The Scripts): Situation A + Exact words to say / action to do.
Slide 6 (The Authority): A brief, "clinical" insight or proof of why this works.
Slide 7 (Dual CTA): Soft nudge with "Follow for more". No link in bio

Create a hook based on one of these examples (choose a random hook 1-10, or create a variation of one. Focus on "how to x", "x ways to y". Don't use a question for hook):
1. "3 ways to join a group conversation without it feeling awkward"
2. "The simple shift that makes people feel deeply understood when you speak"
3. "How to keep a conversation flowing naturally without ever forcing it"
4. "A 5 minute framework for turning an acquaintance into a real connection" 
5. "How to project high authority in a room without saying a word"
6. "How to say no in a way that actually makes people respect you more"
7. "A mindset shift for speaking to high authority people with total ease"
8. "3 ways to introduce yourself that make people want to hear more"
9. "How to move a stale conversation toward a topic everyone enjoys"
10."How to leave a lasting positive impression in the first 60 seconds"

background_query: "rich lifestyle city people" (use this as is don't change it)

Slide show focus should be on self improvement and life improvement advice. Even though the brand is tech related, focus on specifically self improvement that will result in being well rounded (not just tech focused).`)
                }
              >
                Social/Convo Preset
              </Button>
            </div>

            {/* Brand Selection */}
            <div className="space-y-2">
              <Label htmlFor="brand-select">Select Brand</Label>
              <Select
                value={selectedProfile}
                onValueChange={setSelectedProfile}
              >
                <SelectTrigger id="brand-select">
                  <SelectValue placeholder="Choose a brand..." />
                </SelectTrigger>
                <SelectContent>
                  {brands?.map((brand) => {
                    const settings = getBrandSettings(brand);
                    return (
                      <SelectItem key={brand.id} value={brand.id}>
                        {settings?.name || "Unnamed Brand"}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {selectedProfile &&
                brands &&
                (() => {
                  const brand = brands.find((b) => b.id === selectedProfile);
                  const settings = brand ? getBrandSettings(brand) : null;
                  return settings ? (
                    <p className="text-sm text-muted-foreground">
                      Niche: {settings.niche}
                    </p>
                  ) : null;
                })()}
            </div>

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

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={
                (selectedGenType === "template" && !selectedTemplate) ||
                (selectedGenType === "prompt" && !genertationPrompt) ||
                !selectedProfile ||
                createPost.isPending ||
                generating
              }
              size="lg"
            >
              {createPost.isPending || generating
                ? "Generating..."
                : "Generate Post"}
            </Button>
          </CardContent>
        </Card>

        {generatedPosts.length > 0 && (
          <div className="space-y-6 mt-6 mb-40">
            {generatedPosts.map((post) => {
              const content = post.content as PostContent;
              const storageUrls = post.storage_urls as { urls?: string[] };
              const slideUrls = storageUrls?.urls || [];

              return (
                <Card key={post.id}>
                  <CardHeader>
                    <CardTitle>Generated Post</CardTitle>
                    <CardDescription>
                      Platform: {post.platform} • Status: {post.status}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Slide Images */}
                    {slideUrls.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold mb-3">Slides</h3>
                        <div className="w-full overflow-x-auto pb-4">
                          <div className="flex flex-row flex-nowrap gap-4">
                            {slideUrls.map((url, i) => (
                              <div key={i} className="flex-shrink-0">
                                <img
                                  src={url}
                                  alt={`Slide ${i + 1}`}
                                  className="rounded-lg w-80 h-auto shadow-lg"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Caption */}
                    {content?.caption && (
                      <div>
                        <h3 className="text-sm font-semibold mb-2">Caption</h3>
                        <p className="text-sm text-muted-foreground bg-muted p-4 rounded-lg whitespace-pre-wrap">
                          {content.caption}
                        </p>
                      </div>
                    )}

                    {/* Hashtags */}
                    {content?.hashtags && content.hashtags.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold mb-2">Hashtags</h3>
                        <div className="flex flex-wrap gap-2">
                          {content.hashtags.map((tag, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 bg-kinetic-mint/10 text-kinetic-mint rounded-full text-sm"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* <div>
          <p>Posts: {JSON.stringify(posts)}</p>
          <p>
            BRANDSETTINGs:{" "}
            {JSON.stringify(
              brands?.find((b) => b.id == selectedProfile)?.brand_settings
            )}
          </p>
          <div></div>
          <p>
            TEMPLATE:{" "}
            {JSON.stringify(templates?.find((t) => t.id == selectedTemplate))}
          </p>
        </div> */}

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
