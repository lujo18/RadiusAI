"use client";

import { useEffect, useState } from "react";
import { useTemplates, useProfiles, useCreatePost } from "@/lib/api/hooks";
import { Template } from "@/types/template";
import { BrandSettings } from "@/types/user";
import { contentApi } from "@/lib/api/client";
import { createPostsFromTemplate } from "@/services/slideGenerator";

export default function GeneratePage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedProfile, setSelectedProfile] = useState<string>("");

  const { data: templates, isLoading: templatesLoading } = useTemplates();
  const { data: profiles, isLoading: profilesLoading } = useProfiles();

  const [generating, setGenerating] = useState(false);
  const [posts, setPosts] = useState({});

  const [generatedBlobs, setGeneratedBlobs] = useState<Blob[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const createPost = useCreatePost();

  useEffect(() => {
    return () => {
      imageUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageUrls]);

  const handleGenerate = async () => {
    console.log("Generate");
    if (!selectedTemplate || !selectedProfile) {
      alert("Please select both a template and profile");
      return;
    }

    setGenerating(true);
    console.log("Point 1");
    const template = templates?.find((t) => t.id === selectedTemplate);
    const profile = profiles?.find((p) => p.id === selectedProfile);

    if (!template || !profile) {
      setGenerating(false);
      return;
    }

    try {
      //const posts = await contentApi.generatePosts(template, profile.brandSettings, 1)

      const blobs = await createPostsFromTemplate(template, profile, 1);
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

  if (templatesLoading || profilesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Generate Post</h1>
        <p className="text-gray-400 mb-8">
          Select a template and profile to generate a new post
        </p>

        <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6 space-y-6">
          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Template
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Choose a template...</option>
              {templates?.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            {selectedTemplate && templates && (
              <div className="mt-2 text-sm text-gray-400">
                Template: {templates.find((t) => t.id === selectedTemplate)?.name}
              </div>
            )}
          </div>

          {/* Profile Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Profile
            </label>
            <select
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value)}
              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Choose a profile...</option>
              {profiles?.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.brandSettings.name}
                </option>
              ))}
            </select>
            {selectedProfile && profiles && (
              <div className="mt-2 text-sm text-gray-400">
                Niche:{" "}
                {
                  profiles.find((p) => p.id === selectedProfile)?.brandSettings
                    .niche
                }
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={
              !selectedTemplate ||
              !selectedProfile ||
              createPost.isPending ||
              generating
            }
            className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {createPost.isPending || generating
              ? "Generating..."
              : "Generate Post"}
          </button>
        </div>

        <div>
          <h1>Slide output</h1>

          {imageUrls.map((url, i) => (
            <img key={i} src={url} alt={`Slide ${i + 1}`} />
          ))}
        </div>

        <div>
          <p>Posts: {JSON.stringify(posts)}</p>
          <p>
            BRANDSETTINGs:{" "}
            {JSON.stringify(
              profiles?.find((p) => p.id == selectedProfile)?.brandSettings
            )}
          </p>
          <div></div>
          <p>
            TEMPLATE:{" "}
            {JSON.stringify(templates?.find((t) => t.id == selectedTemplate))}
          </p>
        </div>

        {/* Empty States */}
        {!templatesLoading && templates?.length === 0 && (
          <div className="mt-6 text-center text-gray-400 text-sm">
            No templates found. Create a template first.
          </div>
        )}
        {!profilesLoading && profiles?.length === 0 && (
          <div className="mt-6 text-center text-gray-400 text-sm">
            No profiles found. Create a profile first.
          </div>
        )}
      </div>
    </div>
  );
}
