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

type Brand = Database["public"]["Tables"]["brand"]["Row"];

function getBrandSettings(brand: Brand): BrandSettings | null {
  if (!brand.brand_settings) return null;
  return brand.brand_settings as unknown as BrandSettings;
}

export default function GeneratePage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const [selectedGenType, setSelectedGenType] = useState<string>("");
  const [genertationPrompt, setGenertationPrompt] = useState<string>("Create a '5 tips for better sleep' slideshow");
  const [generating, setGenerating] = useState(false);
  const [posts, setPosts] = useState({});
  const [generatedBlobs, setGeneratedBlobs] = useState<Blob[]>([]);
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

    let blobs;

    if (brand && selectedGenType === "template" && rawTemplate) {
      // Patch template.brand_id to always be string|null
      const template = {
        ...rawTemplate,
        brand_id:
          typeof rawTemplate.brand_id === "undefined"
            ? null
            : rawTemplate.brand_id,
        tags: typeof rawTemplate.tags === "undefined" ? null : rawTemplate.tags,
        content_rules: {},
      };

      console.log("Generating with template")
      blobs = await createPostsFromTemplate(template, brand, 1);
    } else if (brand && selectedGenType === "prompt" && prompt) {

      console.log("Auto generating with prompt")
      blobs = await createPostsFromPrompt(prompt, brand, 1);
    } else {
      setGenerating(false);
      return;
    }

    try {
      console.log("Blobs", blobs)
      setGeneratedBlobs(blobs);
      const images = blobs.map((blob) => URL.createObjectURL(blob));
      setImageUrls(images);
      alert("Post generated successfully!");
      setSelectedTemplate("");
      setSelectedProfile("");
    } catch (error) {
      console.error("Failed to generate post:", error);
      alert("Failed to generate post");
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

        {imageUrls.length > 0 && (
          <Card className="mt-6 mb-40">
            <CardHeader>
              <CardTitle>Slide Output</CardTitle>
            </CardHeader>
            <CardContent className="w-full overflow-x-auto pb-4">
              <div className="flex flex-row flex-nowrap gap-4">
                {imageUrls.map((url, i) => (
                  <div key={i} className="flex-shrink-0">
                    <img
                      src={url}
                      alt={`Slide ${i + 1}`}
                      className="rounded-lg w-80 h-auto shadow-lg"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
