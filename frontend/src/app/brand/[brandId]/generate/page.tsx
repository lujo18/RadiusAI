"use client";

import { differenceInSeconds } from "date-fns";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTemplates, useBrands, useCreatePost } from "@/lib/api/hooks";
import { useGenerationStore } from "@/store/generationStore";
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
  const params = useParams();
  const brandId = params?.brandId as string;

  // Store
  const { queue, addToQueue, updateQueueItem } = useGenerationStore();

  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedProfile, setSelectedProfile] = useState<string>(brandId || "");
  const [selectedGenType, setSelectedGenType] = useState<string>("");
  const [genertationPrompt, setGenertationPrompt] = useState<string>(
    "Create a '4 habits that put you in the 1%' slideshow",
  );

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
      alert("Please fill in required fields");
      return;
    }

    // Add to queue and get request ID
    const requestId = addToQueue({
      prompt: selectedGenType === "prompt" ? genertationPrompt : undefined,
      templateId: selectedGenType === "template" ? selectedTemplate : undefined,
    });

    // Update status to generating
    updateQueueItem(requestId, { status: "generating" });

    // Fire async request without blocking
    (async () => {
      try {
        const rawTemplate = templates?.find((t) => t.id === selectedTemplate);
        const brand = brands?.find((b) => b.id === selectedProfile);
        const prompt = genertationPrompt;

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
          await createPostsFromTemplate(template, brand, 1);

          updateQueueItem(requestId, {
            status: "completed",
            result: [],
          });
        } else if (brand && selectedGenType === "prompt" && prompt) {
          console.log("Auto generating with prompt");
          const posts = await contentApi.generatePostsFromPrompt(
            prompt,
            brand.brand_settings as BrandSettings,
            selectedProfile,
            1,
          );

          console.log("Posts", posts);

          // Save posts to database with brand_id
          const savedPosts: typeof posts = [];
          for (const post of posts) {
            try {
              const postDataWithBrand = {
                ...post,
                brand_id: selectedProfile, // Ensure brand_id is set
                platform: post.platform || "tiktok",
                status: post.status || "draft",
                content: post.content,
              };

              await createPost.mutateAsync(postDataWithBrand);
              savedPosts.push(post);
            } catch (error) {
              console.error("Failed to save post:", error);
            }
          }

          setGeneratedPosts((prev) => [...prev, ...savedPosts]);

          updateQueueItem(requestId, {
            status: "completed",
            result: savedPosts,
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
                  setGenertationPrompt(`
ROLE: You are a Behavioral Neuroscientist and High-Stakes Communication Strategist. Your brand is "The Grounded Script." You specialize in the intersection of Evolutionary Psychology and Modern Social Dynamics. Your tone is minimalist, clinical, and high-trust.

THEOLOGY OF CONTENT: We do not provide "tips." We provide Mechanisms. Every post must expose a "Hidden Social Architecture" that the viewer didn't realize was controlling their life.

CONTENT GENERATION PROTOCOL (7 SLIDES):


Slide 1 (The Hook): Apply the Variety Protocol (below). It must be a definitive statement that disrupts the viewer’s current logic.

Slide 2 (The Information Bomb): Name a specific psychological phenomenon (e.g., "The Pratfall Effect," "Signaling Theory," or "The Ben Franklin Effect"). Explain the Evolutionary Why in one punchy sentence.

Slide 3-5 (The Protocol): Provide three distinct social "Scripts."

Requirement: One script must be for a High-Pressure situation; one for a Low-Pressure/Social situation; one for Boundary Setting.

Translate the psychological 'why' into 3rd-grade English. Use short, punchy sentences that hit like a realization, not a lecture

Slide 6 (The Neuro-Insight): A "Clinical" deep-dive. Mention a specific brain region or hormone involved (e.g., "This triggers a release of Oxytocin by lowering the listener's Amygdala response"). This is the "Saveable" slide.

Slide 7 (The Minimalist CTA): "This is a practice, not a hack.
At 1,000 followers, I'm releasing the 'Communication Vault'
(100+ Scripts & Protocols) for free via the link in bio.
Follow to join the waitlist."

HOOK GENERATION PROTOCOL:

Step 1: Selection Seed. Pick a random number 1-10 to select a Core Topic:

Negotiating boundaries | 2. Silent authority | 3. Breaking rapport | 4. Deep connection | 5. Dealing with ego | 6. Charismatic listening | 7. Public perception | 8. Energy conservation | 9. Conflict resolution | 10. Social magnetism.

Step 2: The Variety Filter (Pick a random number 1-3 to select the variety filter):

1. The Shadow: Focus on what they are currently losing (e.g., "The subtle way you’re accidentally leaking authority in group chats.")

2. The Benefit: Focus on the "Unfair Advantage" (e.g., "The journaling method that makes people feel deeply understood when you speak.")

3. The Mechanism: Focus on the 'How' (e.g., "Using the '3-Second Pause' to shift the power dynamic in any room.")

Step 3: The Syntax Check:

Start with a Number, "How to", or "The [Noun]".

NO QUESTIONS. No clickbait words (Secrets/Hacks/Insane).

VISUAL ASSETS (Randomize): background_query: [1. "dark academia library" | 2. "minimalist stone architecture" | 3. "sunrise over foggy city" | 4. "macro linen texture" | 5. "luxury watch/pen detail"]`)
                }
              >
                Social/Convo Preset
              </Button>
              <Button
                onClick={() =>
                  setGenertationPrompt(`ROLE: You are a Systems Architect for Human Behavior. You specialize in creating "SOPs" (Standard Operating Procedures) for the mind and social interactions. Your brand is high-trust, clinical, and data-backed.

OBJECTIVE: Create "Reference Grade" content. The viewer should feel that if they don't save this, they are losing a valuable tool they will need in the future.

CONTENT STRUCTURE (7 SLIDES):

Slide 1 (The Hook): Focus on a Universal Friction Point (e.g., "The 3-part audit for when you feel socially drained").

Slide 2 (The Logic): Introduce a high-level psychological concept like "Cognitive Load Theory" or "Social Exchange Theory." Explain the "Battery" or "System" currently being drained.

Slide 3 (The Diagnostic): A checklist of 3-4 "Symptoms" the user is feeling. (This builds "Micro-Agreements" where the user says "That's me," forcing a save).

Slide 4-5 (The Protocol): A step-by-step Decision Tree.

Format: "If [Scenario A] → Do [Action A]. If [Scenario B] → Do [Action B]."

Slide 6 (The Journaling Anchor): Provide two "Deep-Tissue" journaling prompts that require the user to stop and think. (They save this to do later tonight).

Slide 7 (The Save CTA): "This is a reference tool. Save it for the next time you feel [Problem]."

The Diagnostic and Decision Tree must be so simple that someone in a state of high panic could read and follow them instantly. No complex words. Only clear actions.

HOOK GENERATION PROTOCOL (Reference Focus):

Step 1: Selection Seed. Pick a random number 1-8 for the Tool Category:

Social Battery Audit | 2. Conflict Resolution Tree | 3. The "Respect" Diagnostic | 4. Pre-Meeting Scripting Protocol | 5. Post-Social Anxiety Reset | 6. Boundary Setting Framework | 7. The "High-Authority" Body Language Checklist | 8. Subconscious Money-Block Audit.

Step 2: The Variety Filter:

The "System" Filter: Focus on the tool name (e.g., "The 4-Step Protocol for...").

The "Diagnostic" Filter: Focus on the problem (e.g., "How to identify exactly why...").

The "Manual" Filter: Focus on the reference nature (e.g., "The complete guide to...").

Step 3: Syntax Check:

Start with a Number or a Definitive Noun (e.g., "The 3-minute reset...").

NO QUESTIONS.

BANNED: Hack, Secret, Unlock, Life-changing, Viral.

ALLOWED: Protocol, Framework, Audit, Diagnostic, Architecture, Logic.

VISUAL ASSETS: background_query: [1. "minimalist blueprint" | 2. "clean architectural lines" | 3. "overhead view of open journal" | 4. "muted grey concrete texture" | 5. "desert minimalist landscape"]`)
                }
              >
                High Save: Protocol Prompt
              </Button>
            </div>

            {/* Brand Selection - Auto-populated from route */}
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

            {/* Generate Button */}
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
        </Card>

        {queue.length > 0 && (
          <Card className="mt-6 bg-foreground/5 border-foreground/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Generation Queue ({queue.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {queue.map((request) => {
                  let sec;

                  if (request.status === "generating" || !request.completedAt) {
                    sec = differenceInSeconds(now, new Date(request.createdAt))
                  }
                  else {
                    sec = differenceInSeconds(new Date(request.completedAt), new Date(request.createdAt))
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
                          <span className={`text-xs text-primary ${request.status === "generating" && "animate-pulse"}`}>
                            {sec} seconds
                          </span>
                        </div>
                        <p className="text-xs text-foreground/60">
                          {request.prompt?.slice(0, 50) || request.templateId}
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
        )}

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
